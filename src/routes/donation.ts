const router = require("express").Router()

const {adminAuth,auth} = require("../middlewares/auth")

const donation_controller = require("../controllers/giving/donation")


router.post("/donate",auth,donation_controller.makeDonation)
router.get("/",adminAuth,donation_controller.getAlldonations)
router.get("/filter",adminAuth,donation_controller.filterDonations)

module.exports = router