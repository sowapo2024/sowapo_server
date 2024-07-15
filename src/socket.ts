// socket.js
const socketIo = require('socket.io');
const {
  sendPushNotification,
} = require('./external-apis/fcm_push_notification');
const Influencer = require('./models/Influencer');
const Brand = require('./models/brand');

const initializeSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: '*', // Adjust this as per your client app's URL
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on('join', async ({ chatId, userId }) => {
      socket.join(chatId);
      console.log(`User ${userId} joined chat ${chatId}`);

      try {
        const user =
          (await Influencer.findByIdAndUpdate(userId, {
            lastSeen: Date.now(),
          })) ||
          (await Brand.findByIdAndUpdate(userId, { lastSeen: Date.now() }));

        if (user) {
          console.log(`Updated last seen for user ${userId}`);
        }
      } catch (error) {
        console.log(`Error updating last seen for user ${userId}: `, error);
      }

      socket.to(chatId).emit('userJoined', { userId, chatId });
    });

    socket.on('leave', async ({ chatId, userId }) => {
      socket.leave(chatId);
      console.log(`User ${userId} left chat ${chatId}`);

      try {
        const user =
          (await Influencer.findByIdAndUpdate(userId, {
            lastSeen: Date.now(),
          })) ||
          (await Brand.findByIdAndUpdate(userId, { lastSeen: Date.now() }));

        if (user) {
          console.log(`Updated last seen for user ${userId}`);
        }
      } catch (error) {
        console.log(`Error updating last seen for user ${userId}: `, error);
      }

      socket.to(chatId).emit('userLeft', { userId, chatId });
    });

    socket.on('message', async (message) => {
      const { chatId, pushObject } = message;
      console.log(`New message in chat ${chatId}: `, message);
      io.to(chatId).emit('message', message);
      if (pushObject.token && pushObject.enabled) {
        try {
          await sendPushNotification({
            registrationTokens: [pushObject?.token],
            title:`📩 ${ message?.user?.userName}`||"📥 Incoming message",
            body: message?.text,
            iconUrl: message?.user?.avatar||`https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${message?.user?.userName}`,
            imageUrl: message?.image||message?.user?.avatar,
            deepLink:"Chat"
          });
        } catch (error) {
          console.log('message notification error', error);
        }
      }
    });

    socket.on('typing', (data) => {
      const { chatId, userId, isTyping } = data;
      console.log(`User ${userId} is typing in chat ${chatId}: `, isTyping);
      socket.to(chatId).emit('typing', { userId, chatId, isTyping });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // Optionally, handle user leaving all chats here
    });
  });

  return io;
};

module.exports = initializeSocket;
