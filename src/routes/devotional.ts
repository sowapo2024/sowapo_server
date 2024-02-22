const express = require('express');
const router = express.Router();
const devotionalController = require('../controllers/devotional/devotional');
const {adminAuth,auth} = require("../middlewares/auth")
const subscriptionAuth = require("../middlewares/subscription")
const {allMediaTypes} = require('../middlewares/handleImageMulter')
const { singleImage} = require("../middlewares/handleImageMulter");


// Route to create a new devotional
router.post('/create',adminAuth, singleImage, devotionalController.createDevotional);

// Route to reply to a devotional
router.post('/reply/:id', auth, subscriptionAuth, devotionalController.replyDevotional);

// Route to update a devotional
router.put('/update/:id', auth, subscriptionAuth, devotionalController.updateDevotional);

// Route to get all devotionals
router.get('/', auth, subscriptionAuth, devotionalController.getAllDevotionals);

// Route to get daily devotional by date
router.get('/:date', devotionalController.getDailyDevotional);

// Route to delete a devotional
router.delete('/:id', adminAuth, devotionalController.deleteDevotional);

// Route to subscribe to devotionals
router.post('/subscribe',auth, devotionalController.subscribeToDevotionals);

module.exports = router;
