// pushNotificationService.js

const admin = require('firebase-admin');
// Parse the JSON string from the environment variable
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT);

const { getAllPushTokens } = require('./expo-push-notification');

const Influencers = require('../models/Influencer');
require("dotenv").config()
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


//a delay function for delaying retries.
function delay(duration) {
  return new Promise(resolve => setTimeout(resolve, duration));
}


async function sendPushNotification({
  registrationTokens,
  title,
  body,
  imageUrl,
  iconUrl,
  retryAttempt = 0
}) {
  const payload = {
    notification: {
      title: title || 'default title',
      body: body || 'placeholder body',
    },
    data: {
      imageUrl: imageUrl || '',
      iconUrl: iconUrl || '',
    },
  };

  let pushTokens = registrationTokens || await getAllPushTokens();

  try {
    const response = await admin.messaging().sendToDevice(pushTokens, payload);
    console.log('Successfully sent message:', response);

    const failedTokens = [];
    response.results.forEach((result, index) => {
      if (result.error) {
        console.log(`Error for token ${pushTokens[index]}: ${result.error.code}`);
        switch (result.error.code) {
          case 'messaging/invalid-registration-token':
            console.log("Push token" + pushTokens[index] + "is invalid")
            break;
          case 'messaging/registration-token-not-registered':
            console.log('Disabling push token:', pushTokens[index]);
            Influencers.findOneAndUpdate(
              { 'pushObject.token': pushTokens[index] },
              { 'pushObject.enabled': false },
              { new: true }  // Return the updated document
            ).exec();
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

    if (failedTokens.length > 0) {
      console.log('Failed tokens: ', failedTokens);
      const delayTime = Math.pow(2, retryAttempt) * 1000 + Math.floor(Math.random() * 1000);
      console.log(`Waiting ${delayTime}ms to retry...`);
      await delay(delayTime);
      console.log('Resending notification to failed devices:', failedTokens);
      await sendPushNotification({
        registrationTokens: failedTokens,
        title,
        body,
        imageUrl,
        iconUrl,
        retryAttempt: retryAttempt + 1
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
