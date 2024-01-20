const mongoose = require("mongoose")

const anouncement = new mongoose.Schema({
    title:{
        type:String,
        required:[true,"announcement must have a title"]

    },
    author:{
        type:mongoose.Schema.Types.ObjectId,
        // required:[true,"announcement must have an author"],
        ref: "Admin"
    },
    date:{
        type: Date,
        default: Date.now()
    },
    callToAction:{
        type:String,
    },
    external_link:String,
    body:{
        type:String,
        required:[true,"announcement must have a body"]
    },
    banner:{
        type:String,
    },

},{timestamps:true})


const Anouncements =  mongoose.model("Anouncement",anouncement)

module.exports = Anouncements