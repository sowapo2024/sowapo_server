const Task = require('../../models/task');
const Influencer = require('../../models/Influencer');
const Campaign = require('../../models/campaign');
const mongoose = require('mongoose');

interface Media {
  link: string;
  id: any;
  type: 'video' | 'audio' | 'image';
}

// Create a new task
const createTask = async (req, res) => {
  const { campaignId, reward, duration, description, title, ...others } =
    req.body;

  const influencerId = req.user.id;
  try {
    const influencer = await Influencer.findById(influencerId);
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      console.log('no campaign');
      return res
        .status(400)
        .json({ message: 'Campaign not found: invalid campaign id' });
    } else if (!influencer) {
      console.log('no influencer');

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

      const newTask = new Task({
        campaign: new mongoose.Types.ObjectId(campaignId),
        influencer: new mongoose.Types.ObjectId(influencerId),
        attachmentUrls,
        duration,
        description,
        title,
        reward,
        others,
      });
      await newTask?.save();
      // // update tasks field on the Influencer's Schema
      // await Influencer.findByIdAndUpdate(influencerId, {
      //   $push: { tasks: newTask?._id },
      // });
      // update tasks field on the Campaign's Schema

      await Campaign.findByIdAndUpdate(campaignId, {
        $push: { tasks: newTask?._id },
      });

      return res
        .status(201)
        .json({ data: newTask, message: 'task created successfully' });
    }
  } catch (error) {
    console.log(error, ' create task error');
    res
      .status(500)
      .json({ error: error.message, message: 'something went wrong' });
  }
};

// Update a task
const updateTask = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task?.findOneAndUpdate(
      { _id: id, influencer: req.user.id },
      req.body,
      {
        new: true,
      },
    );
    if (!task) {
      return res.status(404).json({ message: 'task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task?.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ message: 'task not found' });
    }
    res.status(204).json({ message: 'task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Accept a task
// const acceptTask = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const task = await Task?.findById(id)?.populate('influencer');
//     if (!task) {
//       return res.status(404).json({ message: 'task not found' });
//     }

//     const campaign = await Campaign.findByIdAndUpdate(Task?.campaign, {
//       $push: {
//         hires: {
//           influencer: Task?.influencer._id,
//           status: 'hired',
//         },
//       },
//     })?.populate('brand');
//     task.status = 'accepted';

//     await Influencer.findByIdAndUpdate(task?.influencer?._id, {
//       $push: {
//         campaignHistory: {
//           campaign: campaign?._id,
//           status: 'pending',
//         },
//       },
//     });

//     await sendAcceptTask({
//       title: campaign?.title,
//       email: task?.influencer?.email,
//     });

//     if (
//       task?.influencer?.pushObject?.token &&
//       task?.influencer?.pushObject?.enabled
//     ) {
//       await sendPushNotification({
//         registrationTokens: [task?.influencer?.pushObject?.token],
//         title: 'You are hired!',
//         body: `You task for the campaign titled "${campaign?.title}" has been approved and you are hired `,
//         iconUrl: campaign?.brand?.avatar,
//       });
//     }

//     await Task?.save();
//     res.json({ message: 'task accepted', task });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// Reject a task
const rejectTask = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task?.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'task not found' });
    }
    task.status = 'rejected';
    await Task?.save();
    res.json({ message: 'task rejected', task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark a task as Seen
const markAsSeen = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task?.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'task not found' });
    }
    task.seen = true;
    await Task?.save();
    res.json({ message: 'task marked as seen', task });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: 'something went wrong could not mark task as seen',
    });
  }
};

// Mark a task as Complete
const markAsComplete = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task?.findById(id);

    if (!task) {
      return res.status(404).json({ message: 'task not found' });
    }

    // Update influencer's wallet balance
    const influencer = await Influencer.findByIdAndUpdate(
      task.influencer,
      { $inc: { 'wallet.balance': task.reward } },
      { new: true },
    );

    if (!influencer) {
      return res.status(404).json({ message: 'Influencer not found' });
    }
    task.isComplete = true;
    await task?.save();
    res.status(200).json({ message: 'task marked as complete', task });
  } catch (error) {

    console.log(error)
    res.status(500).json({
      error: error,
      message: 'something went wrong could not mark task as complete',
    });
  }
};

const getAlltasks = async (req, res) => {
  try {
    const tasks = await Task?.find();
    if (!tasks) {
      return res.status(404).json({ message: 'tasks not found' });
    }
    res.status(200).json({ message: 'tasks found', tasks });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: 'something went wrong could not fetch tasks',
    });
  }
};

const getInfluencertasks = async (req, res) => {
  const { id } = req.user;
  try {
    const tasks = await Task?.find({ influencer: id })?.populate(
      'campaign.brand',
    );
    if (!tasks) {
      return res.status(404).json({ message: 'tasks not found' });
    }
    res.status(200).json({ message: 'tasks found', tasks });
  } catch (error) {
    console.log(error, 'fetch influencer propsal error');
    res.status(500).json({
      error: error,
      message: 'something went wrong could not fetch tasks',
    });
  }
};

// this controller fetches the task of an influencer attched to a campaign
const getHiretasks = async (req, res) => {
  const { campaignId, influencerId } = req.params;

  try {
    const tasks = await Task?.find({
      influencer: influencerId,
      campaign: campaignId,
    })?.populate('campaign.brand');
    if (!tasks) {
      return res.status(404).json({ message: 'tasks not found' });
    }
    res.status(200).json({ message: 'tasks found', tasks });
  } catch (error) {
    console.log(error, 'fetch influencer propsal error');
    res.status(500).json({
      error: error,
      message: 'something went wrong could not fetch t`asks',
    });
  }
};

const getCampaigntasks = async (req, res) => {
  const { campaignId } = req.params;
  try {
    const tasks = await Task?.find({ campaign: campaignId })
      ?.populate('influencer')
      ?.populate('campaign.brand');
    if (!tasks) {
      return res.status(404).json({ message: 'tasks not found' });
    }
    res.status(200).json({ message: 'tasks found', tasks });
  } catch (error) {
    res.status(500).json({
      error: error,
      message: 'something went wrong could not fetch tasks',
    });
  }
};

module.exports = {
  getAlltasks,
  markAsComplete,
  createTask,
  updateTask,
  deleteTask,
  getCampaigntasks,
  getHiretasks,
  getInfluencertasks,
  rejectTask,
  markAsSeen,
};
