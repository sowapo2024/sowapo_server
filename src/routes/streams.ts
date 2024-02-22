const express = require('express');
const { adminAuth,auth } = require("../middlewares/auth");
const router = express.Router();
const streams = require('../external-apis/streams');




// Read All 
router.get('/livestreams', streams.fetchLiveStreams);

// // Read audio streams
// router.get('/audio',adminAuth, streams.getUserstreamss);


module.exports = router;
