const mongoose = require("mongoose")

const testimony = new mongoose.Schema({
    title:{
        type:String,
        required:[true,"title cannot be empty"]
    },
    phone:{
        type:String,
        required:[true,"phone cannot be empty"]
    },
    email:{
        type:String,
        required:[true,"email cannot be empty"]
    },
    address:{
        type:String,
        required:[true,"address cannot be empty"]
    },
    testifier:{
        type:String,
        required:[true,"testifier cannot be empty"]
    },
    testimony:{
        type:String,
        required:[true,"testimony cannot be empty"]
    },
    testimonyType:{
        type:String,
        required:[true,"testimonyType cannot be empty"]
    },
},{timestamps:true})


const Testimony =  mongoose.model("Testimony",testimony);

module.exports = Testimony