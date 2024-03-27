const router = require("express").Router()
const {
    restrictAdmin,
    restrictUser,
    activateAccount,
    banAccount,
    deleteAdminAccount,
    updateAdmin,
    getAdmin,
    getAllAdmin,
    getUser,
    activateAdminAccount,
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

router.get("/get_users",adminAuth,users_controller.getUsers);

// get all admins
router.get("/get_users",adminAuth,getAllAdmin);


// verify_token
router.get("/verify_token",adminAuth,verifyToken);

// get a user
router.get("/get_user/:userId",adminAuth,getUser);

// get admin
router.get("/get_admin/:adminId",adminAuth,getAdmin);
router.put("/update",adminAuth,updateAdmin);



//generate graph data
router.get("/generate_graph/:year",adminAuth,generateAllUsersGraphData);

// delete user account
router.delete("/delete_user/:userId",adminAuth,deleteAccount)
router.delete("/delete_admin/:adminId",adminAuth,deleteAdminAccount)


// restrict user
router.put("/restrict/user/:userId",adminAuth, restrictUser)


// restrict admin
router.put("/restrict/admin/:adminId",adminAuth, restrictAdmin)


// activate user
router.put("/activate/:userId",adminAuth, activateAccount)
router.put("/activate/admin/:adminId",adminAuth, activateAdminAccount)


module.exports = router