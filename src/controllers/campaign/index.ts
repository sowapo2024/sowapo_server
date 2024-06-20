const Campaign = require('../../models/campaign');
const mongoose = require('mongoose');
const { Types } = mongoose;
const {
  sendPushNotification,
} = require('../../external-apis/fcm_push_notification');

const {
  sendCampaignApproval,
  sendCampaignSuspended,
} = require('../../utils/mailer');


interface Media {
  link: string;
  id: any;
  type: 'video' | 'audio' | 'image';
}
// create Campaign
exports.createCampaign = async (req, res) => {
  try {
    // const { name, author, description, audience }: Request_body = req.body;
    const attachmentUrls: Media[] = req.filePaths.map((file) => ({
      link: file.path,
      _id: new mongoose.Types.ObjectId(file.filename),
      type: file.mimetype.split('/')[0],
      file_extension: file.mimetype.split('/')[1],
    }));

    const newCampaign = new Campaign({
      ...req.body,
      attachmentUrls,
      brand: req.user.id,
    });
    const savedCampaign = await newCampaign.save();

    // await sendGeneralPushNotification({title:"New Campaign", subtitle:title, body:description.slice(0,100)+ " read more..."})
    // await sendPushNotification({
    //   title:name,
    //   subtitle: 'announcement',
    //   body: description.slice(0, 100) + ' read more...',
    //   // imageUrl: med,
    // });

    res
      .status(201)
      .json({ data: savedCampaign, message: 'Campaign created successfully' });
  } catch (error) {
    console.error('Error creating Campaign:', error);
    res.status(500).json({ error: 'Internal Server Error', errorStack: error });
  }
};

exports.getAllCampaigns = async (req, res) => {
  try {
    const Campaigns = await Campaign.find().populate('brand'); // Assuming 'username' is a field in the Admin model
    res
      .status(200)
      .json({ data: Campaigns, message: 'Campaigns fetched successfully' });
  } catch (error) {
    console.error('Error getting Campaigns:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//   get a single Campaign
exports.getCampaignById = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const campaign = await Campaign.findById(campaignId)
      .populate('brand')
      ?.populate({
        path: 'hires',
        populate: { path: 'influencer' },
      });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.status(200).json({ data: campaign, message: 'Campaign fetched by id' });
  } catch (error) {
    console.error('Error getting campaign by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.verifyPayment = async (campaignId) => {
  try {
    await Campaign.findByIdAndUpdate(campaignId, {
      $set: { paymentVerified: true },
    });
  } catch (error) {}
};

//   get brand's campaigns
exports.getCampaignsByBrandId = async (req, res) => {
  const { brandId } = req.params;

  try {
    const campaigns = await Campaign.find({ brand: brandId })
      ?.populate('brand')
      ?.populate({path:"proposals",
        populate: [{ path: 'campaign',populate: { path: 'brand' } },{path:"tasks"}]
      })
      ?.populate({
        path: 'hires',
        populate: { path: 'influencer' },
      });

    if (campaigns.length < 1) {
      return res.status(400).json({ message: 'Campaigns not found' });
    }

    res
      .status(200)
      .json({ data: campaigns, message: 'Campaigns fetched by brand ID' });
  } catch (error) {
    console.error('Error getting campaigns by brand ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// filter Campaigns

exports.filterCampaigns = async (req, res) => {
  try {
    let {
      sort,
      q,
      minProposals,
      maxProposals,
      minBudget,
      maxBudget,
      startDate,
      endDate,
      ...query
    } = req.query;

    console.log(req.query, 'filter query');

    // Construct the text search condition
    if (q) {
      query.$text = { $search: q };
    }

    // Proposal counts filter
    if (minProposals || maxProposals) {
      query['proposals.length'] = {};
      if (minProposals) {
        query['proposals.length'].$gte = parseInt(minProposals, 10);
      }
      if (maxProposals) {
        query['proposals.length'].$lte = parseInt(maxProposals, 10);
      }
    }

    // Budget filter
    if (minBudget || maxBudget) {
      query['budget.amount'] = {};
      if (minBudget) {
        query['budget.amount'].$gte = parseInt(minBudget, 10);
      }
      if (maxBudget) {
        query['budget.amount'].$lte = parseInt(maxBudget, 10);
      }
    }

    // Date filter
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) {
        query.startDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startDate.$lte = new Date(endDate);
      }
    }

    // Sorting Result
    let sortList = { createdAt: -1 }; // Default sort by createdAt descending
    if (sort) {
      sortList = sort.split(',').reduce((acc, s) => {
        const [field, order] = s.split(':');
        acc[field] = order === 'desc' ? -1 : 1;
        return acc;
      }, {});
      console.log('filter Sortlist', sortList);
    }

    query.isApproved = true;
    query.isSuspended = false;

    const campaigns = await Campaign.find(query)
      .populate('brand')
      .populate({path:"proposals",
        populate: [{ path: 'campaign',populate: { path: 'brand' } },{path:"tasks"}]
      })
      .populate({
        path: 'hires',
        populate: { path: 'influencer' },
      })
      .sort(sortList)
      .exec();

    if (!campaigns || campaigns.length === 0) {
      return res.status(400).json({ data: campaigns, message: 'No item matches your search' });
    }

    return res.status(200).json({ data: campaigns, message: 'Fetched campaigns successfully' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message || 'Something went wrong' });
  }
};


// update Campaign
exports.updateCampaignById = async (req, res) => {
  const { campaignId } = req.params;
  console.log(req.bod,"update campaign request body");

  try {
    // Check if campaignId is a valid ObjectId
    if (!Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ error: 'Invalid Campaign ID' });
    }

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const attachmentUrls: Media[] = req?.filePaths?.map((file) => ({
      link: file.path,
      _id: new mongoose.Types.ObjectId(file.filename),
      type: file.mimetype.split('/')[0],
    }));

    // update existing media URLs based on your requirements
    const existingattachmentUrls = campaign?.attachmentUrls?.filter(
      (existingMedia) =>
        !attachmentUrls.some((newMedia) => newMedia.id === existingMedia.id),
    );

    const updatedCampaign = await Campaign.findByIdAndUpdate(
      campaignId,
      {
        $set: {
          ...req.body,
          attachmentUrls:
            attachmentUrls?.length > 0
              ? [...existingattachmentUrls, ...attachmentUrls]
              : existingattachmentUrls,
        },
      },
      { new: true },
    );

    if (!updatedCampaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.status(200).json({
      data: updatedCampaign,
      message: 'Campaign updated successfully',
    });
  } catch (error) {
    console.error('Error updating Campaign by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
exports.approveCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { isApproved: true, status: 'active', isSuspended: false }, // Optionally, you can change the status to 'active' when approved
      { new: true },
    )
      ?.populate('brand')
      .exec();

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    await sendCampaignApproval({
      email: campaign?.brand?.email,
      title: campaign?.title,
    });

    res.status(200).json({ message: 'Campaign approved', campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.suspendCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { isSuspended: true, status: 'pending', isApproved: false }, // Optionally, you can change the status to 'pending' when suspended
      { new: true },
    )
      ?.populate('brand')
      .exec();

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    await sendCampaignSuspended({
      email: campaign?.brand?.email,
      title: campaign?.title,
    });
    res.status(200).json({ message: 'Campaign suspended', campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reactivateCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { isSuspended: false, status: 'active', isApproved: 'true' }, // Optionally, you can change the status to 'active' when reactivated
      { new: true },
    );

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.status(200).json({ message: 'Campaign reactivated', campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markCampaignAsCompleted = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { status: 'completed'}, 
      { new: true },
    );

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.status(200).json({ message: 'Campaign marked as complete', campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleHiringStatus = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    campaign.hiring = !campaign.hiring;

    await campaign.save();

    res.status(200).json({ message: 'Campaign hiring status updated', campaign });
  } catch (error) {
    console.error('Error updating campaign hiring status:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


// delete Campaign by id
exports.deleteCampaignById = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const deletedCampaign = await Campaign.findByIdAndDelete(campaignId);

    if (!deletedCampaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.status(200).json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting Campaign by ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteMediaFromCampaign = async (req, res) => {
  const { campaignId, mediaId }: { campaignId: string; mediaId: string } =
    req.params;

  try {
    const campaign = await Campaign.findByIdAndUpdate(campaignId, {
      attachmentUrls: {
        $pull: {
          _id: mediaId,
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const updatedImages = campaign.attachmentUrls.filter(
      (image) => image.id !== mediaId,
    );

    campaign.attachmentUrls = updatedImages;
    const updatedCampaign = await Campaign.save();

    res
      .status(200)
      .json({ data: Campaign, message: 'Media has been deleted ' });
  } catch (error) {
    console.error('Error deleting image from Campaign:', error);
    res.status(500).json({ error: 'Internal Server Error', errorStack: error });
  }
};

module.exports;
