const mongoose = require("mongoose")

const book = new mongoose.Schema({
    title:{
        type:String,
        required:[true,"book must have a title"],
        // unique:[true,"A book already exists with the same title"]

    },
    author:{
        type:String,
        required:[true,"book must have an author"]
    },
    callToAction:{
        type:String,
        default:"Buy book"
    },
    currency:{
        type:String,
        enum:["NGN","USD","GBP"]
    },
    amount:{
        type:Number,
        required:[true,"Type is required"]
    },
    book_link:{
        type:String,
        required:[true,"book must  have a file link"]
    },
    cover_image:{
        type:String,
        required:[true,"book must  have a cover Image link"]
    },
    sold:{
        type:Number,
        default:0
    },
    description:{
        type:String,
        required:[true,"book must have a description"]
    }

},{timestamp:true})


const Books = new mongoose.model("Book",book)

module.exports = Books