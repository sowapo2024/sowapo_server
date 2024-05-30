const express = require('express');
const { adminAuth,auth,brandAuth } = require("../middlewares/auth");
const router = express.Router();
const transaction = require('../controllers/transactions/transaction');



adminAuth
// Read All 
router.get('/',adminAuth, transaction.getAllTransactions);

// Read Single Transaction
router.get('/:id',adminAuth, transaction.getTransaction);


// get Transactions involving an influencer
router.get('/influencer/:id',auth, transaction.getInfluencerTransactions);

// get Transactions involving a brand
router.get('/brand/:id',auth, transaction.getBrandTransactions);


// // Update Testimony
// router.put('/update/:id',adminAuth, transaction.updateTestimony);

// // Delete Testimony
// router.delete('/delete/:id',adminAuth, transaction.deleteTestimony);

module.exports = router;
            