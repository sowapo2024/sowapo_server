const express = require('express');
const { adminAuth,auth } = require("../middlewares/auth");
const router = express.Router();
const testimonyControllers = require('../controllers/testimonies/testimony');

// Create Testimony
router.post('/create',auth, testimonyControllers.createTestimony);

//get  by email
router.post('/get_by_email',auth, testimonyControllers.getAllTestimoniesByEmail);


// Read All 
router.get('/get',auth, testimonyControllers.getAllTestimonies);

// Read Single Testimony
router.get('/get/:id',auth, testimonyControllers.getTestimonyById);

// Update Testimony
router.put('/update/:id',auth, testimonyControllers.updateTestimony);

// Delete Testimony
router.delete('/delete/:id',auth, testimonyControllers.deleteTestimony);

module.exports = router;
