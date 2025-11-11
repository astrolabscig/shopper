import React, { useState } from 'react'
import './AddProduct.css'
import upload_area from '../../assets/upload.png'

const AddProduct = () => {

    const [image, setImage] = useState(false);
    const [productDetails, setProductDetails] = useState({
        name: '',
        image: '',
        old_price: '',
        new_price: '',
        category: '',

    });

    const imageHandler = (e) => {
        setImage(e.target.files[0]);
        console.log(e.target.files[0]);
    }
    const changeHandler = (e) => {
        setProductDetails({
            ...productDetails, [e.target.name]:e.target.value
        })
    }
    const Add_Product = async ()=>{
        console.log(productDetails)
        let responseData;
        let product = productDetails;

        let formData = new FormData();
            formData.append('product', image);
            
            await fetch('http://localhost:4000/upload', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                },
                body: formData,
            }).then(response => response.json()).then((data)=>{responseData=data});

            if(responseData.success){
                product.image = responseData.image_url;
                console.log(product)
                await fetch('http://localhost:4000/add_product', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(product),
                }).then((response)=>response.json()).then((data)=>{
                    data.success ? alert('Product Added Successfully') : alert("Failed to add product")
                })
            }
    }

  return (
    <div className='add-product'>
        <div className="addproduct-itemfield">
            <p>Product Title</p>
            <input value={productDetails.name} onChange={changeHandler} type="text" name="name" placeholder='Enter Title'/>
        </div>
        <div className="addproduct-price">
            <div className="addproduct-itemfield">
                <p>Price</p>
                <input value={productDetails.old_price} onChange={changeHandler} type="text" name="old_price" id=""  placeholder='Enter the old price'/>
            </div>
            <div className="addproduct-itemfield">
                <p>Offer Price</p>
                <input value={productDetails.new_price} onChange={changeHandler} type="text" name="new_price" id=""  placeholder='Enter the new price'/>
            </div>
        </div>
        <div className="addproduct-itemfield">
            <p>Product Category</p>
            <select value={productDetails.category} onChange={changeHandler}  name="category" id="" className='addproduct-selector'>
                <option value=""></option>
                <option value="women">Women</option>
                <option value="men">Men</option>
                <option value="Kids">Kids</option>
            </select>
        </div>
        <div className="addproduct-itemfield">
            <label htmlFor="file-input">
                <img src={image ? URL.createObjectURL(image) : upload_area} alt="" className='addproduct-thumbnail' />
            </label>
            <input onChange={imageHandler} type="file" name="image" id="file-input" hidden/>
        </div>
        <button onClick={()=> {Add_Product()}} className='addproduct-btn'>ADD</button>
    </div>
  )
}

export default AddProduct