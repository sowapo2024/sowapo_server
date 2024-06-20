const admin = require('firebase-admin');
const Influencers = require('../models/Influencer');
const Brand = require('../models/brand');
require('dotenv').config();

// Parse the JSON string from the environment variable
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// A delay function for delaying retries.
function delay(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

async function updatePushTokenStatus(pushToken) {
  try {
    const influencerUpdate = Influencers.findOneAndUpdate(
      { 'pushObject.token': pushToken },
      { 'pushObject.enabled': false },
      { new: true },
    ).exec();

    const brandUpdate = Brand.findOneAndUpdate(
      { 'pushObject.token': pushToken },
      { 'pushObject.enabled': false },
      { new: true },
    ).exec();

    const [updatedInfluencer, updatedBrand] = await Promise.all([
      influencerUpdate,
      brandUpdate,
    ]);

    if (updatedInfluencer) {
      console.log(`Updated influencer: ${updatedInfluencer}`);
    }

    if (updatedBrand) {
      console.log(`Updated brand: ${updatedBrand}`);
    }
  } catch (err) {
    console.error('Error updating push token status:', err);
  }
}

async function sendPushNotification({
  registrationTokens,
  title,
  body,
  imageUrl,
  deepLink,
  iconUrl,
  retryAttempt = 0,
  maxRetries = 5, // Add a maximum retry limit
}) {
  const payload = {
    tokens: registrationTokens,
    notification: {
      title: title || 'default title',
      body: body || 'placeholder body',
      image: imageUrl || '', // Large image for Android and iOS
    },
    data: {
      deepLink: deepLink || '', // Add deep link to data
      iconUrl: iconUrl || '', // Icon URL in data for custom handling
    },
    android: {
      notification: {
        image: imageUrl, // Large image for Android
        icon: iconUrl, // Custom icon for Android
      },
    },
    apns: {
      payload: {
        aps: {
          'mutable-content': 1, // Enable mutable content for media attachment
        },
        'media-url': imageUrl || '', // Media attachment for iOS
      },
      fcm_options: {
        image: imageUrl || '', // Image URL for iOS
      },
    },
  };

  let pushTokens = registrationTokens;

  try {
    if (pushTokens.length === 0) {
      throw new Error('You must supply at least one push token');
    }

    const response = await admin.messaging().sendMulticast(payload);
    console.log('Successfully sent message:', response);

    const failedTokens = [];
    response.responses.forEach(async (result, index) => {
      if (result.error) {
        console.log(
          `Error for token ${pushTokens[index]}: ${result.error.code}`,
        );
        switch (result.error.code) {
          case 'messaging/invalid-registration-token':
            console.log('Push token ' + pushTokens[index] + ' is invalid');
            break;
          case 'messaging/registration-token-not-registered':
            console.log('Disabling push token:', pushTokens[index]);
            await updatePushTokenStatus(pushTokens[index]);
            break;
          case 'messaging/internal-error':
          case 'messaging/server-unavailable':
            failedTokens.push(pushTokens[index]);
            break;
          default:
            break;
        }
      }
    });

    if (failedTokens.length > 0 && retryAttempt < maxRetries) {
      console.log('Failed tokens: ', failedTokens);
      const delayTime =
        Math.pow(2, retryAttempt) * 1000 + Math.floor(Math.random() * 1000);
      console.log(`Waiting ${delayTime}ms to retry...`);
      await delay(delayTime);
      console.log('Resending notification to failed devices:', failedTokens);
      await sendPushNotification({
        registrationTokens: failedTokens,
        title,
        body,
        imageUrl,
        iconUrl,
        deepLink,
        retryAttempt: retryAttempt + 1,
        maxRetries,
      });
    }

    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

module.exports = {
  sendPushNotification,
};
