import { __param } from "tslib";

const express = require("express");
const router = express.Router();
const { adminAuth,auth } = require("../middlewares/auth");
const sermon_controller = require("../controllers/sermons/sermon")
const { allMediaTypes} = require("../middlewares/handleImageMulter");



// @route   sermon api/sermons/create
// @desc    send user data for registeration
// @access  public
router.post("/create",allMediaTypes,sermon_controller.createSermon );

// @route   sermon api/sermon/login
// @desc    send user data for logging in
// @access  public
router.get("/get", sermon_controller.getAllSermons);


// @route   sermon api/sermon/create_profile
// @desc    sermon user data
// @access  private
router.get("/get/:sermonId",sermon_controller.getSermonById);

// @route   sermon api/sermons/update_sermon
// @desc    sermon user data
// @access  private
router.put("/update/:sermonId",allMediaTypes, sermon_controller.updateSermonById );

// @route   sermon api/sermon/create_avatar
// @desc    sermon user image
// @access  private
router.delete("/delete/:sermonId",sermon_controller.deleteSermonById);



// @route   PUT api/sermon/upload_images
// @desc    PUT delete images
// @access  private
router.delete("/delete_media/:sermonId/:mediaId", sermon_controller.deleteImageFromSermon);

router.get("/filter",auth,sermon_controller.filterSermons)


module.exports = router;
