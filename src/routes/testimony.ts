const express = require('express');
const router = express.Router();
const testimonyControllers = require('../controllers/testimonies/testimony');

// Create Testimony
router.post('/create', testimonyControllers.createTestimony);

//get  by email
router.post('/get_by_email', testimonyControllers.getAllTestimoniesByEmail);


// Read All 
router.get('/get', testimonyControllers.getAllTestimonies);

// Read Single Testimony
router.get('/get/:id', testimonyControllers.getTestimonyById);

// Update Testimony
router.put('/update/:id', testimonyControllers.updateTestimony);

// Delete Testimony
router.delete('/delete/:id', testimonyControllers.deleteTestimony);

module.exports = router;
