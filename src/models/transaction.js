const mongoose = require("mongoose");

const transaction = new mongoose.Schema({
    reference: {
        type:String,
        required:[true,"transaction must have a reference"],
        unique:true
    },
    access_code:{
        type:String,
        required:[true,"transaction must have a amount"],
    },
    amount:{
        type:String,
        required:[true,"transaction must have a amount"],
    },
    currency:{
        type:String,
        required:[true,"transaction must have a amount"],
    },
    user:{
        type:mongoose.Types.ObjectId,
        ref:'User'
    },
    book:{
        type:mongoose.Types.ObjectId,
        ref:'Books'
    },
    email:{
        type:String,
        required:[true,"transaction must have an email"],
    },
    status:{
        type:String,
        enum:["successful","failed","pending"],
        default:"pending"
    },
    type:{
        type:String,
        enum:["offering","tithe","book_purchase"],
        required:[true,"transaction must have a type"],
    }
},{timestamps:true})

const Transactions = new mongoose.model("Transactions",transaction)

module.exports = Transactions