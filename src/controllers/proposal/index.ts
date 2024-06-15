const Proposal = require('../../models/proposal');
const Task = require('../../models/task');
const Influencer = require('../../models/Influencer');
const Campaign = require('../../models/campaign');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { sendAcceptProposal } = require('../../utils/mailer');
const {
  sendPushNotification,
} = require('../../external-apis/fcm_push_notification');

interface Media {
  link: string;
  id: any;
  type: 'video' | 'audio' | 'image';
}

// Create a new Proposal
exports.createProposal = async (req, res) => {
  const {
    campaignId,
    price,
    duration,
    coverLetter,
    title,
    paymentMode,
    tasks,
  } = req.body;

  const campaignPrice = JSON.parse(price);
  const influencerId = req.user.id;

  try {
    const influencer = await Influencer.findById(influencerId);
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      console.log('no campaign');
      return res
        .status(400)
        .json({ message: 'Campaign not found: invalid campaign id' });
    }

    if (!influencer) {
      console.log('no influencer');
      return res
        .status(400)
        .json({ message: 'Influencer not found: invalid influencer id' });
    }

    const attachmentUrls = req.filePaths.map((file) => ({
      link: file.path,
      _id: new mongoose.Types.ObjectId(file.filename),
      type: file.mimetype.split('/')[0],
      file_extension: file.mimetype.split('/')[1],
    }));

    const newProposal = new Proposal({
      campaign: new mongoose.Types.ObjectId(campaignId),
      influencer: new mongoose.Types.ObjectId(influencerId),
      attachmentUrls,
      duration,
      coverLetter,
      paymentMode,
      title,
      price: {
        amount: campaignPrice?.amount,
        period: campaignPrice?.period,
      },
    });

    if (paymentMode === 'task_based' && tasks && tasks.length > 0) {
      const taskPromises = JSON.parse(tasks).map(async (task) => {
        const newTask = new Task({campaign:campaignId,influencer:influencerId,...task});
        await newTask.save();
        return newTask._id;
      });

      const taskIds = await Promise.all(taskPromises);
      newProposal.tasks = taskIds;
    }

    await newProposal.save();

    // Update proposals field on the Influencer's Schema
    await Influencer.findByIdAndUpdate(influencerId, {
      $push: { proposals: newProposal._id },
    });

    // Update proposals field on the Campaign's Schema
    await Campaign.findByIdAndUpdate(campaignId, {
      $push: { proposals: newProposal._id },
    });

    return res
      .status(201)
      .json({ data: newProposal, message: 'Proposal created successfully' });
  } catch (error) {
    console.log(error, 'create proposal error');
    res
      .status(500)
      .json({ error: error.message, message: 'Something went wrong' });
  }
};

// Update a Proposal
exports.updateProposal = async (req, res) => {
  const { id } = req.params;

  try {
    const proposal = await Proposal.findOneAndUpdate(
      { _id: id, influencer: req.user.id },
      req.body,
      {
        new: true,
      },
    );
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a Proposal
exports.deleteProposal = async (req, res) => {
  const { id } = req.params;

  try {
    const proposal = await Proposal.findByIdAndDelete(id);
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    res.status(204).json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Accept a Proposal
exports.acceptProposal = async (req, res) => {
  const { id } = req.params;

  try {
    const proposal = await Proposal.findById(id).populate('influencer');
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const campaign = await Campaign.findById(proposal.campaign).populate(
      'brand',
    );
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check if the influencer is already hired for this campaign
    const alreadyHired = campaign.hires.some(
      (hire) =>
        hire.influencer.toString() === proposal.influencer._id.toString(),
    );

    if (alreadyHired) {
      return res
        .status(400)
        .json({ message: 'Influencer already hired for this campaign' });
    }

    // Update the campaign hires
    campaign.hires.push({
      influencer: proposal.influencer._id,
      status: 'hired',
    });

    // Update the proposal status
    proposal.status = 'accepted';

    // Update the influencer's campaign history
    await Influencer.findByIdAndUpdate(proposal.influencer._id, {
      $push: {
        campaignHistory: {
          campaign: campaign._id,
          status: 'pending',
        },
      },
    });

    // Send notification email to the influencer
    await sendAcceptProposal({
      title: campaign.title,
      email: proposal.influencer.email,
    });

    // Send push notification to the influencer if enabled
    if (
      proposal.influencer.pushObject?.token &&
      proposal.influencer.pushObject?.enabled
    ) {
      await sendPushNotification({
        registrationTokens: [proposal.influencer.pushObject.token],
        title: 'You are hired!',
        body: `Your proposal for the campaign titled "${campaign.title}" has been approved and you are hired`,
        iconUrl: campaign.brand.avatar,
      });
    }

    // Save the updates
    await campaign.save();
    await proposal.save();

    res.json({ message: 'Proposal accepted', proposal });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// Reject a Proposal
exports.rejectProposal = async (req, res) => {
  const { id } = req.params;

  try {
    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    proposal.status = 'rejected';
    await proposal.save();
    res.json({ message: 'Proposal rejected', proposal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//remove hire from campaign
// Remove a Hire from a Campaign
exports.removeHire = async (req, res) => {
  const { campaignId, influencerId } = req.params;

  try {
    // Find the campaign by ID
    const campaign = await Campaign.findById(campaignId).populate('brand');
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Find the hire in the campaign's hires array
    const hireIndex = campaign.hires.findIndex(
      (hire) => hire.influencer.toString() === influencerId.toString(),
    );

    Proposal.findOneAndUpdate({influencer:influencerId},{$set:{status:"rejected"}})

    if (hireIndex === -1) {
      return res.status(404).json({ message: 'Hire not found in campaign' });
    }

    // Remove the hire from the hires array
    campaign.hires.splice(hireIndex, 1);

    // Update the influencer's campaign history
    await Influencer.findByIdAndUpdate(influencerId, {
      $pull: {
        campaignHistory: {
          campaign: campaign._id,
        },
      },
    });

    // Save the updated campaign
    await campaign.save();

    res.json({ message: 'Hire removed from campaign' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAttachment = async (req, res) => {
  const { url, id } = req.params;

  try {
    const proposal = await Proposal.findByIdAndUpdate(id, {
      $pull: { attachments: { link: url } },
    });
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    await proposal.save();
    res.json({ message: 'attachment removed', proposal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark a Proposal as Seen
exports.markAsSeen = async (req, res) => {
  const { id } = req.params;

  try {
    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    proposal.seen = true;
    await proposal.save();
    res.json({ message: 'Proposal marked as seen', proposal });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: 'something went wrong could not mark proposal as seen',
    });
  }
};

exports.getAllProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find();
    if (!proposals) {
      return res.status(404).json({ message: 'Proposals not found' });
    }
    res.status(200).json({ message: 'Proposals found', proposals });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: 'something went wrong could not fetch proposals',
    });
  }
};

exports.getInfluencerProposals = async (req, res) => {
  const { id } = req.user;
  try {
    const proposals = await Proposal.find({ influencer: id })?.populate({
      path: 'campaign',
      populate: {
        path: 'brand',
      },
    }).populate("tasks");
    if (!proposals) {
      return res.status(404).json({ message: 'Proposals not found' });
    }
    res.status(200).json({ message: 'Proposals found', proposals });
  } catch (error) {
    console.log(error, 'fetch influencer propsal error');
    res.status(500).json({
      error: error,
      message: 'something went wrong could not fetch proposals',
    });
  }
};

exports.getCampaignProposals = async (req, res) => {
  const { id } = req.params;
  try {
    const proposals = await Proposal.find({ campaign: id })
      ?.populate('influencer')
      ?.populate('tasks')
      ?.populate('campaign.brand');
    if (!proposals) {
      return res.status(404).json({ message: 'Proposals not found' });
    }
    res.status(200).json({ message: 'Proposals found', proposals });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: 'something went wrong could not fetch proposals',
    });
  }
};
