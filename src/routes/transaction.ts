const express = require('express');
const { adminAuth,auth } = require("../middlewares/auth");
const router = express.Router();
const transaction = require('../controllers/transactions/transaction');




// Read All 
router.get('/get',adminAuth, transaction.getAllTransactions);

// Read Single Transaction
router.get('/get/:id',adminAuth, transaction.getUserTransactions);

// // Update Testimony
// router.put('/update/:id',adminAuth, transaction.updateTestimony);

// // Delete Testimony
// router.delete('/delete/:id',adminAuth, transaction.deleteTestimony);

module.exports = router;
            