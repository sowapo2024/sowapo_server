const express = require("express");
const router = express.Router();
const { adminAuth,auth } = require("../middlewares/auth");
const post_controller = require("../controllers/posts/post")
const { allMedia,allMediaTypes} = require("../middlewares/handleImageMulter");


// @route   POST api/posts/create
// @desc    send user data for registeration
// @access  public
router.post("/create",allMediaTypes,post_controller.createPost );

// @route   POST api/users/login
// @desc    send user data for logging in
// @access  public
router.get("/get_posts",auth, post_controller.getAllPosts);



// users_validation.validateLogin,
// @route   POST api/users/create_profile
// @desc    Post user data
// @access  private
router.get("/get_post/:postId",auth,post_controller.getPostById);


// users_validation.validateLogin,
// @route   POST api/posts/update_post
// @desc    Post user data
// @access  private
router.post("/update_post/:postId",allMediaTypes, post_controller.updatePostById );


// users_validation.validateLogin,
// @route   POST api/users/create_avatar
// @desc    Post user image
// @access  private
router.delete("/delete_post/:postId",post_controller.deletePostById);




// users_validation.validateLogin,
// @route   PUT api/users/upload_images
// @desc    PUT delete images
// @access  private
router.delete("/delete_media/:postId/:mediaId",auth, post_controller.deleteImageFromPost);

router.get("/filter",auth,post_controller.filterPosts)


module.exports = router;
