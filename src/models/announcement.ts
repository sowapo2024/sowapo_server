


const mongoose = require("mongoose")
const Schema = mongoose.Schema()

const anouncement = new Schema({
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
    callToAction:{
        type:String,
    },
    link:String,
    body:{
        type:String,
        required:[true,"announcement must have a body"]
    },
    banner:[{
        type:String,
    }],

},{timeStamp:true})


const Anouncements = new mongoose.Model("Anouncement",anouncement)

module.exports = Anouncements