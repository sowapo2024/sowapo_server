const express = require("express");
const router = express.Router();
const { auth,verifyOTP } = require("../middlewares/auth");
const InfluencerController = require("../controllers/Influencer");
const pushNotification = require("../external-apis/push-notification")
const { singleImage, multipleImages,singleMulterImageHandler } = require("../middlewares/handleImageMulter");



// @route   POST api/users/signup
// @desc    send user data for registeration
// @access  public
router.post("/register",InfluencerController.register );

// // register push token
router.post("/register_push_token",auth,pushNotification.registerToken);




// verify user email

router.put(
  "/verify_email",
  verifyOTP,
  InfluencerController.verifyEmail
);


// @route   POST api/users/login
// @desc    send user data for logging in
// @access  public
router.post("/login", InfluencerController.login);



// users_validation.validateLogin,
// @route   POST api/users/create_profile
// @desc    Post user data
// @access  private
router.post("/profile/create",auth, InfluencerController.createProfile);


// users_validation.validateLogin,
// @route   POST api/users/create_profile
// @desc    Post user data
// @access  private
router.post("/profile/update",auth, InfluencerController.editInfluencer);


// users_validation.validateLogin,
// @route   POST api/users/create_avatar
// @desc    Post user image
// @access  private
router.post("/upload_avatar",auth,singleImage, InfluencerController.createAvatar);


// filter influencers
router.get('/filter', InfluencerController.filterInfluencers);



// users_validation.validateLogin,
// @route   PUT api/users/upload_images
// @desc    PUT delete images
// @access  private
// router.put("/delete_images/:imageId",auth, InfluencerController.deleteUserImage);


// users_validation.validateLogin,
// @route   GET api/users/user
// @desc    Get user data
// @access  public
router.get("/get_Influencer",auth,InfluencerController.getInfluencer);

router.get("/campaign",auth,InfluencerController.getInfluencerCampaignHistory);



// @route   PUT api/users/edit_account
// @desc    Edit user data
// @access  private
router.put(
  "/edit_account",
  auth,
  InfluencerController.editInfluencer
);


// @route   PUT api/users/change_password
// @desc    Edit user data
// @access  private
router.put(
  "/reset_password_otp",
  InfluencerController.forgotPasswordLink
);
// @route   PUT api/users/reset_password
// @desc    Edit user data
// @access  private
router.put(
  "/reset_password",
  verifyOTP,
  InfluencerController.resetPassword
);

// @route   PUT api/users/change_password
// @desc    Edit user data
// @access  private
router.put(
  "/change_password",
  auth,
  InfluencerController.changePassword
);

// @route   PUT api/users/delete_account
// @desc    delete user account
// @access  private
router.post(
  "/delete_account",
  auth,
  InfluencerController.deleteAccount
);

//verify user token
router.get('/verify_token',auth,InfluencerController.verifyToken)



module.exports = router;
