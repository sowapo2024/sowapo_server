


const mongoose = require("mongoose")
const Schema = mongoose.Schema()

const book = new Schema({
    title:{
        type:String,
        required:[true,"announcement must have a title"]

    },
    author:{
        type:String,
        required:[true,"announcement must have a title"]
    },
    date:{
        type: Date,
        default: Date.now()
    },
    // callToAction:{
    //     type:String,
    // },
    currency:{
        type:String,
        enum:["NGN","USD","GBP"]
    },
    price:{
        type:Number,
        required:[true,"Type is required"]
    },
    Download_link:String,
    cover_image:[{
        type:String,
    }],

},{timeStamp:true})


const Books = new mongoose.Model("Book",book)

module.exports = Books