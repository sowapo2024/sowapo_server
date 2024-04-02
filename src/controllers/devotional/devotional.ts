const mongoose = require('mongoose');
const Devotional = require('../../models/devotional');
const Comment = require('../../models/comment');
const { initiatePayments } = require('../../external-apis/paystack');
const Transaction = require('../../models/transaction');
const Subscription = require('../../models/subscription');
const User = require("../../models/Users")
const { sendGeneralPushNotification } = require('../../external-apis/expo-push-notification');


exports.createDevotional = async (req, res) => {
  if (req.file) {
    try {
      const { title, body, author, content, bible_verse, date } = req.body;
      const devotional = new Devotional({
        title,
        body,
        imageUrl: req.file.path,
        author,
        content,
        bible_verse,
        date,
      });
      await devotional.save();
      res
        .status(201)
        .json({ data: devotional, message: 'fetch devotional sucessful ' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(400).json({ message: 'request body does not contain file' });
  }
};

exports.replyDevotional = async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user.id;
  try {
    const comment = new Comment({
      message,
      devotional:new mongoose.Schema.ObjectId(id),
      commentator: new mongoose.Schema.ObjectId(userId),
      reply_to:"devotional"
    });
    try {
      const devotional = await Devotional.findOneAndUpdate(
        { _id: id },
        { $push: { comments: comment._id } },
      ).exec();
      await comment.save();
      res.status(201).json({ msg: 'reply created successfully' });
    } catch (error) {
      res.json({ msg: 'reply creation is not successful', error });
    }
    res.status(201).send();
  } catch (error) {
    res.send(error);
  }
};

exports.updateDevotional = async (req, res) => {
  try {
    const { title, content, bible_verse, date } = req.body;
    const devotional = await Devotional.findById(req.params.id);
    if (title) devotional.title = title;
    if (content) devotional.content = content;
    if (bible_verse) devotional.verse = bible_verse;
    if (date) devotional.date = date;
    await devotional.save();
    res.json(devotional);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllDevotionals = async (req, res) => {
  try {
    const devotionals = await Devotional.find().populate({
      path: 'comments.commentator',
      populate: { path: 'registrationDataId' },
    });
    res.json({ msg: 'request successful', devotionals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDailyDevotional = async (req, res) => {
  try {
    const devotionals = await Devotional.find().populate({
      path: 'comments.commentator',
      populate: { path: 'registrationDataId' },
    });

    const dailyDevotion = devotionals.filter((devotion) => {
      return (
        new Date(devotion).toDateString() ===
        new Date().toDateString()
      );
    });
    res.status(200).json({message:"devotion fetched successfully", devotion: dailyDevotion });
  } catch (error) {
    res.status(500).json({ message: error.message || 'something went wrong' });
  }
};

exports.deleteDevotional = async (req, res) => {
  try {
    const devotional = await Devotional.findById(req.params.id);
    await devotional.remove();
    res.json({ message: 'Devotional deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.subscribeToDevotionals = async (req, res) => {
  const { email } = req.body;

  let amount:string, currency:string ;

  amount = "1000000"
  currency = "NGN"
  if (email && amount && currency) {
      try {
    const payment = await initiatePayments({ amount, email, currency });

    const { checkout_url, message, access_code, reference } = payment;

    const transaction = await Transaction.create({
      access_code,
      amount,
      message,
      reference,
      email,
      currency,
      type: 'devotional_subscription',
      user:new mongoose.Types.ObjectId(req?.user?.id),
    });

    return res
      .status(200)
      .json({ data: { checkout_url }, message: 'subsription complete' });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: 'something went wrong, subsription failed', error });
  }
  }
  else{
    return res
    .status(400)
    .json({ message: 'email, currency, amount cannot be empty' });
  }

};




 exports.sendDailyDevotionReminder = async() => {
  try {
    const title = "Good Morning, Subscriber!";
    const body = "Here's your exclusive daily update!";
    const pushTokens = await getAllPushTokensForSubscribedUsers();
    
    if (pushTokens.length > 0) {
      await sendGeneralPushNotification({pushTokenArray:pushTokens , title , body});
      console.log("Daily push notification sent to subscribed users successfully.");
    } else {
      console.log("No push tokens found for subscribed users.");
    }
  } catch (error) {
    console.error("Failed to send daily push notification to subscribed users:", error);
  }
}

const getAllPushTokensForSubscribedUsers = async () => {
  try {
    const users = await User.find({ 'pushObject.enabled': true });

    const filteredUsers = users.filter((user)=>user?.subscription?.endDate >= new Date() )

    // Initialize pushTokens as an empty array
    let pushTokens = [];

    // Extract push tokens for users with pushObject.enabled
    filteredUsers.forEach((user) => {
      if (user.pushObject && user.pushObject.token) {
        pushTokens.push(user.pushObject.token);
      }
    });

    // Return the array of push tokens
    return pushTokens;
  } catch (error) {
    console.error('Failed to fetch push to', error);
    // Handle the error appropriately - maybe throw it or return an empty array
    throw error; // Or return []; based on how you want to handle the error.
  }
};


