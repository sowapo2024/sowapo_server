const Influencer = require('../models/Influencer');
const Brand = require('../models/brand');

const registerToken = async (req, res) => {
  const { id, accountType } = req.user;
  const { pushToken } = req.body;
  const user =
    accountType == 'Brand'
      ? await Brand.findById(id)
      : await Influencer.findById(id);

  console.log(` accountType : ${accountType}, user: ${user}`);

  console.log(pushToken, 'pushToken');

  if (pushToken) {
    try {
      const pushObject = {
        token: pushToken,
        enabled: true,
      };

      if (user) {
      console.log(user, 'user');

        user.pushObject = pushObject;
        user.save(user)
        
        return res
        .status(200)
        .json({ message: 'PushToken registered sucessfully' });
      }else{
        return res
        .status(400)
        .json({ message: 'User not found' });
      }


    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: 'Something went wrong: pushToken could not be added',
        error: error,
      });
    }
  } else {
    return res
      .status(400)
      .json({ message: 'pushToken should be added to request body' });
  }
};




const getAllPushTokens = async () => {
  try {
    const influencers = await Influencer.find({ 'pushObject.enabled': true });

    const brands = await Brand.find({ 'pushObject.enabled': true });

    // Initialize pushTokens as an empty array
    let pushTokens = [];

    // Extract push tokens for users with pushObject.enabled
    influencers.forEach((user) => {
      if (user.pushObject && user.pushObject.token) {
        pushTokens.push(user.pushObject.token);
      }
    });

    // Extract push tokens for users with pushObject.enabled
    brands.forEach((user) => {
      if (user.pushObject && user.pushObject.token) {
        pushTokens.push(user.pushObject.token);
      }
    });

    // Return the array of push tokens
    return pushTokens;
  } catch (error) {
    console.error('Failed to fetch push to');
    // Handle the error appropriately - maybe throw it or return an empty array
    throw error; // Or return []; based on how you want to handle the error.
  }
};

const getInfluencersPushTokens = async () => {
  try {
    const influencers = await Influencer.find({ 'pushObject.enabled': true });

    // Initialize pushTokens as an empty array
    let pushTokens = [];

    // Extract push tokens for users with pushObject.enabled
    influencers.forEach((user) => {
      if (user.pushObject && user.pushObject.token) {
        pushTokens.push(user.pushObject.token);
      }
    });

    // Return the array of push tokens
    return pushTokens;
  } catch (error) {
    console.error('Failed to fetch push to');
    // Handle the error appropriately - maybe throw it or return an empty array
    throw error; // Or return []; based on how you want to handle the error.
  }
};

const getBrandPushTokens = async () => {
  try {
    const brands = await Brand.find({ 'pushObject.enabled': true });

    // Initialize pushTokens as an empty array
    let pushTokens = [];

    // Extract push tokens for users with pushObject.enabled
    brands.forEach((user) => {
      if (user.pushObject && user.pushObject.token) {
        pushTokens.push(user.pushObject.token);
      }
    });

    // Return the array of push tokens
    return pushTokens;
  } catch (error) {
    console.error('Failed to fetch push to');
    // Handle the error appropriately - maybe throw it or return an empty array
    throw error; // Or return []; based on how you want to handle the error.
  }
};

module.exports = {
  registerToken,
  getBrandPushTokens,
  getInfluencersPushTokens,
  getAllPushTokens,
};
