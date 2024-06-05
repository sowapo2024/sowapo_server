const express = require("express");
const router = express.Router();
const { adminAuth,auth,brandAuth } = require("../middlewares/auth");
const feedbackController = require("../controllers/general/feedback")




router.post("/influencer/create",auth,feedbackController.createFeedback );
router.post("/brand/create",brandAuth,feedbackController.createFeedback );



// verify user email

router.put(
  "/mark",
  adminAuth,
  feedbackController.markFeedbackAsSeen
);

router.get("/",adminAuth,feedbackController.getAllFeedbacks)





module.exports = router;
