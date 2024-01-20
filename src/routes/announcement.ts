const express = require('express');
const router = express.Router();
const {auth,adminAuth} = require("../middlewares/auth")
const {singleImage} = require('../middlewares/handleImageMulter') //import the cloudinary single image upload
const announcementControllers = require('../controllers/announcement/announcement'); 

// Create Announcement
router.post('/create',singleImage, announcementControllers.createAnnouncement);

// Read All Announcements
router.get('/get', announcementControllers.getAllAnnouncements);

// Read Single Announcement
router.get('/get/:id', announcementControllers.getAnnouncementById);

// Update Announcement
router.put('/update/:id',singleImage, announcementControllers.updateAnnouncement);

// Delete Announcement
router.delete('/delete/:id', announcementControllers.deleteAnnouncement);

module.exports = router;
