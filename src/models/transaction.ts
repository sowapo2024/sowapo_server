const mongoose = require("mongoose");

const transaction = new mongoose.Schema({
    reference: {
        type:String,
        required:[true,"transaction must have a reference"],
        unique:true
    },
    access_code:{
        type:String,
        required:[true,"transaction must have an access code"],
    },
    amount:{
        type:String,
        required:[true,"transaction must have an amount"],
    },
    currency:{
        type:String,
        required:[true,"transaction must have a currency"],
    },
    influencer:{
        type:mongoose.Types.ObjectId,
        ref:'Influencer'
    },
    brand:{
        type:mongoose.Types.ObjectId,
        ref:'Brand'
    },
    campaign:{
        type:mongoose.Types.ObjectId,
        ref:'Campaign'
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
        enum:["withdrawal","brand_subscription","influencer_subscription","campaign_reward"],
        required:[true,"transaction must have a type"],
    }
},{timestamps:true})

const Transactions =  mongoose.model("Transaction",transaction)

module.exports = Transactions