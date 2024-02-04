const mongoose =  require("mongoose")

const stream = new mongoose.Schema({
    title:{
        type:String,
        required:["true","title is required and can not be empty"]
    },
    banner:{
        type:String,
        required:["true","banner is required and can not be empty"]
    },
    type:{
        type:String,
        required:["true","type is required and can not be empty"],
        enum:["audio","video"]
    },
    media:{
        type:String,
        required:["true","media is required and can not be empty"]
    },
    description:{
        type:String,
        required:["true","description is required and can not be empty"]
    }
},{timestamps:true})