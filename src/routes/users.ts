const express = require("express");
const router = express.Router();
const { auth,verifyOTP } = require("../middlewares/auth");
const users_controller = require("../controllers/authentication/userController");
const pushNotification = require("../external-apis/expo-push-notification")
const { singleImage, multipleImages,singleMulterImageHandler } = require("../middlewares/handleImageMulter");

let i =0

// @route   POST api/users/signup
// @desc    send user data for registeration
// @access  public
router.post("/register",users_controller.createUser );

// register push token
router.post("/register_push_token",auth,pushNotification.registerToken);


// verify user email

router.put(
  "/verify_email",
  verifyOTP,
  users_controller.verifyEmail
);


// @route   POST api/users/login
// @desc    send user data for logging in
// @access  public
router.post("/login", users_controller.login);



// users_validation.validateLogin,
// @route   POST api/users/create_profile
// @desc    Post user data
// @access  private
router.post("/create_profile",auth, users_controller.createProfile);


// users_validation.validateLogin,
// @route   POST api/users/create_profile
// @desc    Post user data
// @access  private
router.post("/update_profile",auth, users_controller.editUser);


// users_validation.validateLogin,
// @route   POST api/users/create_avatar
// @desc    Post user image
// @access  private
router.post("/upload_avatar",auth,singleImage, users_controller.createAvatar);




// users_validation.validateLogin,
// @route   PUT api/users/upload_images
// @desc    PUT delete images
// @access  private
router.put("/delete_images/:imageId",auth, users_controller.deleteUserImage);


// users_validation.validateLogin,
// @route   GET api/users/user
// @desc    Get user data
// @access  public
router.get("/get_user",auth,users_controller.getUser);



// @route   PUT api/users/edit_account
// @desc    Edit user data
// @access  private
router.put(
  "/edit_account",
  auth,
  users_controller.editUser
);


// @route   PUT api/users/change_password
// @desc    Edit user data
// @access  private
router.put(
  "/reset_password_link",
  users_controller.forgotPasswordLink
);
// @route   PUT api/users/reset_password
// @desc    Edit user data
// @access  private
router.put(
  "/reset_password",
  verifyOTP,
  users_controller.resetPassword
);

// @route   PUT api/users/change_password
// @desc    Edit user data
// @access  private
router.put(
  "/change_password",
  auth,
  users_controller.changePassword
);

// @route   PUT api/users/delete_account
// @desc    delete user account
// @access  private
router.post(
  "/delete_account",
  auth,
  users_controller.deleteAccount
);

//verify user token
router.get('/verify_token',auth,users_controller.verifyToken)



module.exports = router;
