const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;
const jwtAdminSecret = process.env.JWT_ADMIN_SECRET;

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
      if (req.user.isRestricted) {
        res.status(401).json({ message: "Your account is banned, contact us" });
      } else next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          message: "Session Expired",
          error: error.message,
        });
      }
      if (error instanceof jwt.JsonWebTokenError ) {
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
  
    console.log(token)
  
    // check for token
    if (!token)
      return res.status(401).json({
        message: "Invalid Token Format",
      });
  
    try {
      //verify token
      const decoded = jwt.verify(token, jwtAdminSecret);
  
      // add user from token payload which contains the user id we attached to the token
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


  module.exports = {auth,adminAuth}