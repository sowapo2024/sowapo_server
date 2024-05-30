const express = require('express');
const router = express.Router();
const { auth, brandAuth,adminAuth } = require('../middlewares/auth');
const {
  singleImage,
  allMediaTypes,
} = require('../middlewares/handleImageMulter');

// Assuming your controller functions are exported from a module named './controllers/proposalController'
const {
  createProposal,
  updateProposal,
  deleteProposal,
  acceptProposal,
  rejectProposal,
  markAsSeen,
  deleteAttachment,
  getAllProposals,
getInfluencerProposals,
getCampaignProposals,
} = require('../controllers/proposal/index');

// Route to create a new proposal
router.post('/create', auth, allMediaTypes,createProposal);

// get all proposals
router.get("/get",adminAuth,getAllProposals)

// get influencer proposals
router.get("/influencer/:id",auth,getInfluencerProposals)

// get campaign proposals
router.get("/campaign/:id",auth,getCampaignProposals)

// Route to update an existing proposal
router.put('/:id', auth, updateProposal);

// Route to delete a proposal
router.delete('/:id', auth, deleteProposal);

// to remove attachment
router.delete('/:id/attachment/:url', auth, deleteAttachment);

// Route to accept a proposal
router.patch('/:id/accept', brandAuth, acceptProposal);

// Route to reject a proposal
router.patch('/:id/reject', brandAuth, rejectProposal);

// Route to mark a proposal as seen
router.patch('/:id/seen', markAsSeen);

module.exports = router;
