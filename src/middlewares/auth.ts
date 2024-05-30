const jwt = require("jsonwebtoken");
require("dotenv")
const jwtSecret = process.env.JWT_SECRET;
const jwtBrand = process.env.JWT_BRAND_SECRET
const jwtAdminSecret = process.env.JWT_ADMIN_SECRET;
const OTP = require("../models/otp")


const auth = (req, res, next) => {
    const token = req.header("x-auth-token");
  
    // check for token
    if (!token)
      return res
        .status(403)
        .json({ message: "Authorization denied, please login" });
  
    try {
      //verify token
      const decoded = jwt.verify(token, jwtSecret);
  
      // add user from token payload which contains the user id we attached to the token
      req.user = decoded;
  
      // restrict all permissions from the restricted users
      if (req.user.isSuspended) {
       return res.status(401).json({ message: "Your account is banned, contact us" });
      } else next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          message: "Session Expired",
          error: error.message,
        });
      }
      if (error instanceof jwt.JsonWebTokenError ) {
        console.log(error)
        return res.status(401).json({
          message: "Invalid Token",
          error: error.message,
        });
      }
      res.status(500).json({
        message: "Internal server Error",
        error: error.message,
        stack: error.stack,
      });
    }
  };


  const brandAuth = (req, res, next) => {
    const token = req.header("x-auth-token");
  
    // check for token
    if (!token)
      return res
        .status(403)
        .json({ message: "Authorization denied, please login" });
  
    try {
      //verify token
      const decoded = jwt.verify(token, jwtBrand);
  
      // add user from token payload which contains the user id we attached to the token
      req.user = decoded;
  
      // restrict all permissions from the restricted users
      if (req.user.isSuspended) {
       return res.status(401).json({ message: "Your account is banned, contact us" });
      } else next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          message: "Session Expired",
          error: error.message,
        });
      }
      if (error instanceof jwt.JsonWebTokenError ) {
        console.log(error)
        return res.status(401).json({
          message: "Invalid Token",
          error: error.message,
        });
      }
      res.status(500).json({
        message: "Internal server Error",
        error: error.message,
        stack: error.stack,
      });
    }
  };

  
  // check only admin auth
const adminAuth = (req, res, next) => {
    const token = req.header("x-auth-token");
  
    console.log(token,"token")
  
    // check for token
    if (!token)
      return res.status(401).json({
        message: "Invalid Token Format",
      });
  
    try {
      //verify token
      const decoded = jwt.verify(token, jwtAdminSecret);
  
      // add admin from token payload which contains the user id we attached to the token
      req.admin = decoded;
  
    next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          message: "Session Expired",
          error: error.message,
        });
      }
      if (
        error instanceof jwt.JsonWebTokenError ||
        error instanceof jwt.TokenError
      ) {
        return res.status(401).json({
          message: "Invalid Token",
          error: error.message,
        });
      }
      res.status(500).json({
        message: "Internal server Error",
        error: error.message,
        stack: error.stack,
      });
    }
  };

  // verifyOTP middleware
  const verifyOTP = async (req, res,next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    try {
        const otpDocument = await OTP.findOne({ email: email, otp: otp });

        if (!otpDocument) {
            return res.status(404).json({ message: 'OTP is incorrect or does not exist.' });
        }

        // Check if the OTP has expired
        const currentTime = Date.now();
        if (currentTime - otpDocument.expires > 300000) {
            // Optionally, delete the expired OTP document here
            // await otpDocument.remove();
            return res.status(410).json({ message: 'OTP has expired.' });
        }

        // OTP is correct and has not expired
        // Here, you can proceed with the user verification process

        // Optionally, delete the OTP document after successful verification
        OTP.findOneAndDelete({otp})

        next()
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}


  module.exports = {auth,adminAuth,verifyOTP,brandAuth}