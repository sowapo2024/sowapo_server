const { Expo } = require('expo-server-sdk');
const { User } = require('../models/Users');

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
let expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: false, // this can be set to true in order to use the FCM v1 API
});

const registerToken = async (req, res) => {
  const { id } = req.user;
  const { pushToken } = req.body;

  if (pushToken) {
    try {
      const pushObject = {
        token: pushToken,
        enabled: true,
      };
      await User.findByIdAndUpdate(id, { pushObject });
      return res
        .status(200)
        .json({ message: 'PushToken registered sucessfully' });
    } catch (error) {
      return res.status(500).json({
        message: 'Something went wrong: pushToken could not be added',
      });
    }
  } else {
    return res
      .status(400)
      .json({ message: 'pushToken should be added to request body' });
  }
};

// Note: Adjust types if using TypeScript and ensure the rest of the environment is configured for TS
const sendGeneralPushNotification = async ( {title, subtitle, body}) => {
  let messages = [];

  const pushTokens = await getAllPushTokens()
  // Corrected check for empty array
  if (pushTokens.length === 0) {
    throw new Error("No push token found");
  }

  for (let pushToken of pushTokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: 'default',
      title,
      subtitle,
      body,
      priority: 'normal',
      data: { withSome: 'data' },
    });
  }

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];

  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
      // Consider implementing more robust error handling here
    }
  }

  // Logic for updating users' latestTicket remains the same
  if (tickets.length > 0) {
    tickets.forEach(async (ticket, i) => {
      // Note: This logic assumes the index matches; consider validating or a different mapping strategy
      if (ticket.id) {
        try {
          await User.findOneAndUpdate({ 'pushObject.token': pushTokens[i] }, { "pushObject.latestTicket": ticket.id });
        } catch (error) {
          console.log(error, "Something went wrong while saving ticket to schema");
        }
      }
    });
  }

  // Delayed receipt error handling
  setTimeout(async () => await handleRecieptErrors(tickets), 1800000);

  return tickets; // Optionally return the tickets to the caller for further processing
};


const handleRecieptErrors = async (tickets) => {
  let receiptIds = [];
  for (let ticket of tickets) {
    // NOTE: Not all tickets have IDs; for example, tickets for notifications
    // that could not be enqueued will have error information and no receipt ID.
    if (ticket.id) {
      receiptIds.push(ticket.id);
    }
  }

  let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  (async () => {
    // Like sending notifications, there are different strategies you could use
    // to retrieve batches of receipts from the Expo service.
    for (let chunk of receiptIdChunks) {
      try {
        let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        console.log(receipts);

        // The receipts specify whether Apple or Google successfully received the
        // notification and information about an error, if one occurred.
        for (let receiptId in receipts) {
          let { status, details } = receipts[receiptId];
          if (status === 'ok') {
            continue;
          } else if (status === 'error') {
            console.error(`There was an error sending a notification`);
            if (details && details.error) {
              switch (details.error) {
                case 'DeviceNotRegistered':
                  User.findOneAndUpdate({"pushObject.latestTicket":receiptId},{"pushObject.enabled": false})
                
                  break;

                default:
                  break;
              }
              console.error(`The error code is ${details.error}`);
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  })();
};

const getAllPushTokens = async () => {
  try {
    const users = await User.find({ 'pushObject.enabled': true });

    // Initialize pushTokens as an empty array
    let pushTokens = [];

    // Extract push tokens for users with pushObject.enabled
    users.forEach((user) => {
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
  sendGeneralPushNotification,
  handleRecieptErrors,
  getAllPushTokens,
};
