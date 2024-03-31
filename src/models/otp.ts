const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const otpSchema = new Schema({
    email: {
        type: String,
        required: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },    
    otp:{
        type:String,
        required:true
    },
    expires: {
        type: Date,
        default: Date.now() + 300000, // 5 minutes from now
        index: { expires: '5m' } // Automatically delete after 5 minutes
    }    

},{timestamps:true});

const OTP = mongoose.model("OTP", otpSchema);
module.exports = OTP;
