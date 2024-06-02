const express = require("express");
const router = express.Router();
const { brandAuth,verifyOTP } = require("../middlewares/auth");
const brandController = require("../controllers/brand");
const pushNotification = require("../external-apis/push-notification")
const { singleImage } = require("../middlewares/handleImageMulter");



// @route   POST api/users/signup
// @desc    send user data for registeration
// @access  public
router.post("/register",brandController.register );

// register push token
router.post("/register_push_token",brandAuth,pushNotification.registerToken);




// verify user email

router.put(
  "/verify_email",
  verifyOTP,
  brandController.verifyEmail
);


// @route   POST api/users/login
// @desc    send user data for logging in
// @access  public
router.post("/login", brandController.login);



// users_validation.validateLogin,
// @route   POST api/users/create_profile
// @desc    Post user data
// @access  private
router.post("/profile/create",brandAuth, brandController.createProfile);


// users_validation.validateLogin,
// @route   POST api/users/create_profile
// @desc    Post user data
// @access  private
router.post("/profile/update",brandAuth, brandController.editBrand);


// users_validation.validateLogin,
// @route   POST api/users/create_avatar
// @desc    Post user image
// @access  private
router.post("/upload_avatar",brandAuth,singleImage, brandController.createAvatar);




// users_validation.validateLogin,
// @route   PUT api/users/upload_images
// @desc    PUT delete images
// @access  private
// router.put("/delete_images/:imageId",brandAuth, brandController.deleteUserImage);


// users_validation.validateLogin,
// @route   GET api/users/user
// @desc    Get user data
// @access  public
router.get("/brand",brandAuth,brandController.getBrand);

// router.get("/campaign",brandAuth,brandController.getBrandCampaignHistory);



// @route   PUT api/users/edit_account
// @desc    Edit user data
// @access  private
router.put(
  "/edit_account",
  brandAuth,
  brandController.editBrand
);


// @route   PUT api/users/change_password
// @desc    Edit user data
// @access  private
router.put(
  "/reset_password_otp",
  brandController.forgotPasswordLink
);
// @route   PUT api/users/reset_password
// @desc    Edit user data
// @access  private
router.put(
  "/reset_password",
  verifyOTP,
  brandController.resetPassword
);

// @route   PUT api/users/change_password
// @desc    Edit user data
// @access  private
router.put(
  "/change_password",
  brandAuth,
  brandController.changePassword
);

// @route   PUT api/users/delete_account
// @desc    delete user account
// @access  private
router.post(
  "/delete_account",
  brandAuth,
  brandController.deleteAccount
);

//verify user token
router.get('/verify_token',brandAuth,brandController.verifyToken)



module.exports = router;
