const port = 4000;
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

app.use(express.json());
app.use(cors());

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'upload', 'images');
fs.mkdirSync(uploadDir, { recursive: true });

// Database connection  with MongoDB
mongoose.connect('mongodb+srv://astrolabscig_db_user:astrolabmongodb@cluster0.yxzt9hr.mongodb.net/ecommerce')

// API creation

app.get('/', (req, res)=>{
    res.send("Express App is running successfully")
})

// Image storage engine
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb)=>{
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})
const upload = multer({storage: storage});

// Creating upload endpoint for images
app.use('/images', express.static(uploadDir))

app.post('/upload/', upload.single('product_image'), (req, res)=>{
    if (!req.file) {
        return res.status(400).json({ success: 0, message: 'No file uploaded' });
    }
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    })
})


// Schema for Creating Products
const Product = mongoose.model('Product', {
    id:{
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image:{
        type: String,
        required: true,
    },
    category:{
        type: String,
        required: true,
    },
    new_price:{
        type: Number,
        required: true,
    },
    old_price:{
        type: Number,
        required: true,
    },
    date:{
        type: Date,
        default: Date.now,
    },
    availability:{
        type: Boolean,
        default: true,
        required: true,
    },
})

// Creating API to add products
app.post('/add_product', async (req, res)=>{
    let products = await Product.find({});
    let id;
    if(products.length>0){
        var last_product = products.slice(-1);
        var last_product = last_product[0];
        id = last_product.id + 1;
    }
    else{
        id = 1;
    }

    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
        availability: req.body.availability,
    });
    console.log(product);
    await product.save();
    console.log("Product Added Successfully");
    res.json({
        success: true,
        name: req.body.name,
        message: "Product Added Successfully"
    });
})

// Creating API for deleting products
app.post('/delete_product',async (req, res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Product Deleted Successfully");
    res.json({
        success: true,
        name: req.body.name,
    })

})

// Creating API to get all products
app.get('/all_products', async (req, res)=>{
    let products = await Product.find({});
    res.send(products);
    console.log("All Products Fetched Successfully")
})

// Schema for Creating Users
const Users = mongoose.model('User', {
    name:{
        type: String,
    },
    email:{
        type: String,
        unique: true,
    },
    password:{
        type: String,
    },
    cartData:{
        type: Object,
    },
    date:{
        type: Date,
        default: Date.now,
    }
})

// Creating Endpoint for User Registration
app.post('/signup', async (req, res)=>{
    let check = await Users.findOne({email: req.body.email});
    if(check){
        return res.status(400).json({
            success: false,
            errors:"existing User"
        })
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
        
    }
    const user = new Users({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    })

    await user.save();

    const data = {
        user:{
            id: user.id
        }
    }

    const token = jwt.sign(data, 'secret_ecom' );
    res.json({
        success: true,
        token
    })

})

// Creating Endpoint for User Login
app.post('/login', async (req, res)=>{
    let user = await Users.findOne({email:req.body.email});
    if(user){
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const data = {
                user:{
                    id: user.id
                }
            }
            const token = jwt.sign(data, 'secret_ecom' );
            res.json({
                success: true,
                token
            })
        }
        else{
            res.json({
                success: false,
                errors: "Wrong Password"
            });
        }
    }
    else{
        res.json({
            success: false,
            errors: "Email not found"
        })
    }
})

// Creating endpoint for newcollection data
app.get('/newcollections', async (req, res)=>{
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    res.send(newcollection);
})
// Creating endpoint for popular in women section
app.get('/popular_in_women', async (req, res)=>{
    let products = await Product.find({category: 'women'});
    let popular_in_women = products.slice(0,4);
    res.send(popular_in_women);
})

// Creating middleware to fetch user
const fetchuser = (req, res, next) => {
    const token = req.header('auth-token');
    if(!token){
        res.status(401).send({errors: "Please authenticate using a valid token"})
    }
    else{
        try{
            const data = jwt.verify(token, 'secret_ecom');
            req.user = data.user;
            next();
        }
        catch(error){
            res.status(401).send({errors: "Please authenticate using a valid token"})
        }
    }
}

// Creating endpoint for adding product in cartdata
app.post('/add_to_cart',fetchuser, async (req, res)=>{
    console.log('added', req.user.id);
    let userData = await Users.findOne({_id: req.user.id});
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData});
    res.send('Added to cart');
});

// Creating endpoint for removing product from cartdata
app.post('/remove_from_cart', fetchuser,  async (req, res)=>{
    console.log('removed', req.user.id);
    let userData = await Users.findOne({_id: req.user.id});
    if( userData.cartData[req.body.itemId] > 0)
    userData.cartData[req.body.itemId] -= 1;
    await Users.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData});
    res.send('Removed from cart');
});

// Creating endpoint for fetching cartdata
app.post('/getcart', fetchuser, async (req, res)=>{
    console.log('GetCart');
    let userData = await Users.findOne({_id: req.user.id});
    res.json(userData.cartData);
});

app.listen(port, (error)=>{
    if(!error){
        console.log("Server Running  on Port "+port);
    }
    else{
        console.log("An error occurred: "+error)
    }
})

/*
  FIXES and NOTES (commented for reference):

  1) Multer field-name mismatch
      - Bug: The frontend was sending the file under the field name 'product_image' while the backend used upload.single('product').
      - Fix: Changed multer to accept upload.single('product_image'). This prevents req.file from being undefined.
      - Also added a check: if (!req.file) return 400 with message 'No file uploaded'.

  2) Upload storage path and missing directory
      - Bug: multer destination was './upload/images' but the directory may not exist and relative paths can be fragile.
      - Fix: Added fs.mkdirSync(uploadDir, { recursive: true }) to ensure the upload directory exists at startup.
      - Uses an absolute path (uploadDir = path.join(__dirname, 'upload', 'images')) for multer storage and express.static.

  3) Users schema typo (cartDate vs cartData)
      - Bug: Schema previously declared `cartDate` but the application reads/writes `cartData` (e.g., userData.cartData[...] ).
      - Fix: Renamed schema field to `cartData` so Mongoose will persist and retrieve cart data correctly.

  4) add_to_cart route missing authentication middleware
      - Bug: The route used req.user but did not include the `fetchuser` middleware in earlier versions (would cause undefined access).
      - Fix: Ensure the route uses `fetchuser` (current file shows this applied). Verify client sends `auth-token` header.

  5) Serve uploaded images reliably
      - Change: express.static now serves files from the absolute uploadDir to avoid cwd-relative issues.

  6) Minor safety and recommended improvements (not all applied here)
      - Add DB connection error handling: consider starting the server only after successful mongoose.connect(). Currently connect is called without then/catch.
      - Wrap DB operations in try/catch to avoid unhandled rejections crashing the server.
      - Consider using more explicit types for cartData (Map or an array) rather than a plain Object.
      - Consider validating file type/size server-side before saving.

  SUMMARY: The changes above make file uploads reliable (matching the frontend), ensure the upload folder is present, and make cart-related reads/writes consistent by fixing schema naming and ensuring auth middleware is applied where req.user is used.

*/