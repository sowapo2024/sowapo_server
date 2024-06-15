const express = require('express');
const router = express.Router();
const { brandAuth, adminAuth } = require('../middlewares/auth');
const {
  singleImage,
  allMediaTypes,
} = require('../middlewares/handleImageMulter');

// Assuming your controller functions are exported from a module named './controllers/campaignController'
const {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  verifyPayment,
  suspendCampaign,
  markCampaignAsCompleted,
  reactivateCampaign,
  approveCampaign,
  getCampaignsByBrandId,
  filterCampaigns,
  updateCampaignById,
  deleteCampaignById,
  deleteMediaFromCampaign,
} = require('../controllers/campaign/index');

const proposalControllers = require("../controllers/proposal/index")

// Route to create a new campaign
router.post('/create', brandAuth, allMediaTypes, createCampaign);

// Route to get all campaigns
router.get('/get', adminAuth, getAllCampaigns);

// Route to get a single campaign by ID
router.get('/get/:campaignId', getCampaignById);

// This might be internally called or triggered via a different event, so exposing via API might not be necessary
// router.post('/:campaignId/verify-payment', verifyPayment);

// Route to get a campaign by Brand ID
router.get('/brand/:brandId', getCampaignsByBrandId);

// Route to filter and sort campaigns
router.get('/filter', filterCampaigns);

// Route to update a specific campaign by ID
router.post('/update/:campaignId', brandAuth, allMediaTypes, updateCampaignById);

// Route to delete a specific campaign by ID
router.delete('/:campaignId', brandAuth, deleteCampaignById);

// Route to delete a specific media from a campaign
router.delete(
  '/:campaignId/media/:mediaId',
  brandAuth,
  deleteMediaFromCampaign,
);

// Route to suspend a campaign
router.put('/suspend/:campaignId', adminAuth, suspendCampaign);

router.put('/unhire/:influencerId/:campaignId', brandAuth, proposalControllers.removeHire);


// Route to reactivate a campaign
router.put('/activate/:campaignId', adminAuth, reactivateCampaign);

// mark campaign as complete

router.put('/complete/:campaignId', brandAuth, markCampaignAsCompleted);


// Route to approve a campaign
router.put('/approve/:campaignId', adminAuth, approveCampaign);

module.exports = router;
