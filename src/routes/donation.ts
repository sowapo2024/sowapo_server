const router = require("express").Router()

const {adminAuth} = require("../middlewares/auth")

const donation_controller = require("../controllers/giving/donation")


router.post("/donate",donation_controller.makeDonation)
router.get("/",adminAuth,donation_controller.getAlldonations)
router.get("/filter",adminAuth,donation_controller.filterDonations)

module.exports = router