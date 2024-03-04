const router = require("express").Router()
const {
    restrictAdmin,
    restrictUser,
    activateAccount,
    banAccount,
    deleteAccount,
    adminSignIn,
    adminSignup,
    generateAllUsersGraphData,
    verifyToken,
  } = require("../controllers/admin/adminController")
const users_controller = require("../controllers/authentication/userController");


  const {adminAuth} = require("../middlewares/auth")


//   admin signUp
router.post("/register",adminSignup);


// admin signIn
router.post("/login",adminSignIn);

// get all users

// users_validation.validateLogin,
// @route   GET api/users/user
// @desc    Get user data
// @access  public
router.get("/get_users",adminAuth,users_controller.getUsers);

// users_validation.validateLogin,
// @route   GET api/users/user
// @desc    Get user data
// @access  public
router.get("/get_user",adminAuth,users_controller.getUser);
//generate graph data
router.get("/generate_graph/:year",adminAuth,generateAllUsersGraphData);

// delete user account
router.delete("/delete_user/:userId",adminAuth,deleteAccount)

// restrict user
router.put("/restrict/user/:userId",adminAuth, restrictUser)


// restrict admin
router.put("/restrict/admin/:adminId",adminAuth, restrictAdmin)


// activate user
router.put("/activate/:userId",adminAuth, activateAccount)

module.exports = router