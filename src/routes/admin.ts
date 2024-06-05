const router = require("express").Router()
const {
    restrictAdmin,
    restrictUser,
    changePassword,
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
    generateAllInfluencerGraphData,
    verifyToken,
  } = require("../controllers/admin/adminController")
const influencers_controller = require("../controllers/Influencer/index");
const brand_controller = require("../controllers/brand/index")


  const {adminAuth} = require("../middlewares/auth")


//   admin signUp
router.post("/register",adminSignup);


// admin signIn
router.post("/login",adminSignIn);

// get all influencers

router.get("/get_influencers",adminAuth,influencers_controller.getInfluencers);

router.get("/get_brands",adminAuth,brand_controller.getBrands);


// get all admins
router.get("/get_admins",adminAuth,getAllAdmin);


// verify_token
router.get("/verify_token",adminAuth,verifyToken);

// get a user
router.get("/get_user/:userId",adminAuth,getUser);

// get admin
router.get("/get_admin/:adminId",adminAuth,getAdmin);
router.put("/update",adminAuth,updateAdmin);



//generate graph data
router.get("/generate_graph/:year",adminAuth,generateAllInfluencerGraphData);

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
router.put("/change_password",adminAuth, changePassword)



module.exports = router