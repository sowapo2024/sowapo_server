const Proposal = require('../../models/proposal');
const Influencer = require('../../models/Influencer');
const Campaign = require('../../models/campaign');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

interface Media {
  link: string;
  id: any;
  type: 'video' | 'audio' | 'image';
}

// Create a new Proposal
exports.createProposal = async (req, res) => {
  const { campaignId, title, coverLetter, ...others } = req.body;

  const influencerId = req.user.id;
  try {
    const influencer = await Influencer.findById(influencerId);
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res
        .status(400)
        .json({ message: 'Campaign not found: invalid campaign id' });
    } else if (!influencer) {
      return res
        .status(400)
        .json({ message: 'Influencer not found: invalid influencer id' });
    } else {
      const attachmentUrls: Media[] = req.filePaths.map((file) => ({
        link: file.path,
        _id: new mongoose.Types.ObjectId(file.filename),
        type: file.mimetype.split('/')[0],
        file_extension: file.mimetype.split('/')[1],
      }));

      const newProposal = new Proposal({
        campaign: mongoose.Types.ObjectId(campaignId),
        influencer: mongoose.Types.ObjectId(influencerId),
        title,
        coverLetter,
        attachmentUrls,
        others,
      });
      await newProposal.save();
      // update proposals field on the Influencer's Schema
      await Influencer.findByIdAndUpdate(influencerId, {
        $push: { proposals: newProposal._id },
      });
      // update proposals field on the Campaign's Schema

      await Campaign.findByIdAndUpdate(campaignId, {
        $push: { proposals: newProposal._id },
      });

      return res
        .status(201)
        .json({ data: newProposal, message: 'proposal created successfully' });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message, message: 'something went wrong' });
  }
};

// Update a Proposal
exports.updateProposal = async (req, res) => {
  const { id } = req.params;

  try {
    const proposal = await Proposal.findOneAndUpdate({_id:id,influencer:req.user.id}, req.body, {
      new: true,
    });
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
    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    await Campaign.findByIdAndUpdate(proposal.campaign, {
      $push: {
        hires: {
          influencer: proposal.influencer,
          status: 'hired',
        },
      },
    });
    proposal.status = 'accepted';
    await proposal.save();
    res.json({ message: 'Proposal accepted', proposal });
  } catch (error) {
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
    res.staus(200).json({ message: 'Proposals found', proposals });
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
    const proposals = await Proposal.find({ influencer: id });
    if (!proposals) {
      return res.status(404).json({ message: 'Proposals not found' });
    }
    res.staus(200).json({ message: 'Proposals found', proposals });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: 'something went wrong could not fetch proposals',
    });
  }
};

exports.getCampaignProposals = async (req, res) => {
  const { id } = req.params;
  try {
    const proposals = await Proposal.find({ campaign: id });
    if (!proposals) {
      return res.status(404).json({ message: 'Proposals not found' });
    }
    res.staus(200).json({ message: 'Proposals found', proposals });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: 'something went wrong could not fetch proposals',
    });
  }
};
