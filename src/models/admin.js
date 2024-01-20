const mongoose = require("mongoose");

const admin = new mongoose.Schema({
    firstName:{
        type:String,
        required:[true,"Admin must have a first Name"]
    },
    lastName:{
        type:String,
        required:[true,"Admin must have a first Name"]
    },
    email:{
        type:String,
        required:[true,"Admin must have a Email"],
        unique:true
    },
    password:{
        type:String,
        required:[true,"Admin must have a password"]
    },
    role:{
        type:String,
        required:[true,"Admin must have a Role"],
        enum:["owner","manager","editor"]
    },
    adminId:{
        type:mongoose.Types.ObjectId,
        default: new mongoose.Types.ObjectId(),
        unique:true
    },
    isSuspended:{
        type:Boolean,
        default:false
    }
},{timestamps:true})


const Admin = new mongoose.model('Admin',admin)

module.exports = Admin