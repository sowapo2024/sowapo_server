const express = require('express');
const { adminAuth,auth } = require("../middlewares/auth");
const router = express.Router();
const testimonyControllers = require('../controllers/testimonies/testimony');

// Create Testimony
router.post('/create', testimonyControllers.createTestimony);

//get  by email
router.post('/get_by_email',auth, testimonyControllers.getAllTestimoniesByEmail);


// Read All 
router.get('/get',adminAuth, testimonyControllers.getAllTestimonies);

// Read Single Testimony
router.get('/get/:id',adminAuth, testimonyControllers.getTestimonyById);

// Update Testimony
router.put('/update/:id',adminAuth, testimonyControllers.updateTestimony);

// Delete Testimony
router.delete('/delete/:id',adminAuth, testimonyControllers.deleteTestimony);

module.exports = router;
