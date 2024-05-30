// socket.js
const socketIo = require('socket.io');
const {sendPushNotification} = require("./external-apis/fcm_push_notification")

const initializeSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: '*', // Adjust this as per your client app's URL
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join', ({ chatId, userId }) => {
      socket.join(chatId);
      console.log(`User ${userId} joined chat ${chatId}`);
      socket.to(chatId).emit('userJoined', { userId, chatId });
    });

    socket.on('leave', ({ chatId, userId }) => {
      socket.leave(chatId);
      console.log(`User ${userId} left chat ${chatId}`);
      socket.to(chatId).emit('userLeft', { userId, chatId });
    });

    socket.on('message', async (message) => {
      const { chatId, pushObject } = message;
      console.log(`New message in chat ${chatId}: `, message);
      io.to(chatId).emit('message', message);
      if (pushObject&&pushObject.enabled) {
        await sendPushNotification({
          registrationTokens: [pushObject?.token],
          title: '💭 New Message',
          body: message?.savedMessage?.text,
          iconUrl: message?.savedMessage?.user.avatar,
          imageUrl: message?.savedMessage?.image,
        });
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
