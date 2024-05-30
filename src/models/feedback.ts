const mongoose = require("mongoose")

const feedbackSchema = new mongoose.Schema({
    message:{
        type:String,
        required:[true,"Feedback must have a message"]
    },
    reason:{
        type:String,
        required:[true,"Feedback must have a reason"]
    },
    subject:{
        type:String,
        required:[true,"Feedback must have a subject"]
    },
    email:{
        type:String,
        required:[true,"Feedback must have a email"]
    },
    authorType:{
        type:String,
        required:[true,"Feedback must have an authorType"],
        enum:["Brand","Influencer"]
    },
    author:{
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'authorType',
        required: true,
    },

    seen:{
        type:Boolean,
        default:false
    }
})

const Feedback =  mongoose.model("Feedback",feedbackSchema)

module.exports = Feedback