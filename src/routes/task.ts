const express = require('express');
const router = express.Router();
const { auth, brandAuth,adminAuth } = require('../middlewares/auth');
const {
  singleImage,
  allMediaTypes,
} = require('../middlewares/handleImageMulter');

// Assuming your controller functions are exported from a module named './controllers/proposalController'
const { createTask,markAsComplete, updateTask, deleteTask, rejectTask, markAsSeen, getAlltasks, getInfluencertasks, getCampaigntasks,getHiretasks } = require('../controllers/task/index');


// Route to create a new proposal
router.post('/create', auth, createTask);
// Update a task
router.put('/update/:id', auth, updateTask);

// Delete a task
router.delete('/:id',auth , deleteTask);

// Reject a task
router.post('/:id/reject', brandAuth, rejectTask);

// Mark a task as seen
router.put('/:id/seen',brandAuth , markAsSeen);
router.put('/:id/complete',brandAuth , markAsComplete);


// Get all tasks
router.get('/get',adminAuth , getAlltasks);

// Get tasks for the logged-in influencer
router.get('/influencer', auth, getInfluencertasks);

// Get tasks for a specific campaign
router.get('/campaign/:campaignId',brandAuth , getCampaigntasks);

router.get('/campaign/:campaignId/hire/:influencerId',brandAuth , getHiretasks);

module.exports = router;
