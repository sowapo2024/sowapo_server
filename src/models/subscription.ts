const mongoose = require("mongoose")

const subscription = new mongoose.Schema({
    startDate:{
        type: Date,
        required: [true," "]
    },
    endDate:{
        type: Date,
        required: [true," "]
    },
    user:{
        type:mongoose.Types.ObjectId,
        ref: "User"
    },
    transaction:{
        type:mongoose.Types.ObjectId,
        ref: "Transaction"
    },
    paused:{
        type: Boolean,
        default: false
    }
},{timestamps:true})

const Subscriptions = mongoose.model("Subscription", subscription)

module.exports = Subscriptions