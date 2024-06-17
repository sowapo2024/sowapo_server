const express = require('express');
const router = express.Router();
const { auth, brandAuth } = require('../middlewares/auth');

const {
  singleImage,
  allMediaTypes,
} = require('../middlewares/handleImageMulter');

const {
  createMessage,
  getAllChats,
  updateMessage,
  deleteMessage,
  getMessages,
  createChat,
  getUserChats,
  blockChat,
  unBlockChat,
  markMessagesAsSeen,
  deleteMessages,
  deleteChat,
  deleteUserChat,
  replyMessage,
  reactToMessage,
} = require('../controllers/chat');

// Routes for creating a new message
// @route   POST api/posts/create
router.post('/message/brand/create', brandAuth, allMediaTypes, createMessage);
router.post('/message/influencer/create', auth, allMediaTypes, createMessage);


// Route for retrieving all chats
router.get('/all', auth, getAllChats);

// Route for updating a message
router.put('/message/:id', auth, allMediaTypes, updateMessage);

// Route for deleting a message
router.delete('/message/influencer/:messageId', auth, deleteMessage);

router.delete('/message/brand/:messageId', brandAuth, deleteMessage);


// Route for retrieving messages in a chat
router.get('/messages/influencer/:id', auth, getMessages);

//for brands
router.get('/messages/brand/:id', brandAuth, getMessages);


// Route for creating a new chat
router.post('/brands/create', brandAuth, createChat);
router.post('/influencers/create', auth, createChat);

// Route for retrieving influencer-specific chats
router.get('/influencer', auth, getUserChats);

// Route for retrieving brand-specific chats
router.get('/brand', brandAuth, getUserChats);

// Route for blocking a chat
router.post('/message/influencer/block/:chatId', auth, blockChat);
router.post('/message/brand/block/:chatId', brandAuth, blockChat);


// Route for unblocking a chat
router.post('/message/unblock/:chatId', auth, unBlockChat);
router.post('/message/unblock/:chatId', brandAuth, unBlockChat);


// Route for marking messages as seen
router.put('/messages/seen', auth, markMessagesAsSeen);

// Route for deleting multiple messages
router.delete('/messages/delete', auth, deleteMessages);

// Route for deleting a chat
router.delete('/delete/:id', auth, deleteChat);

// Route for deleting a user's chat
router.delete('/influencer/chat/delete/:id', auth, deleteUserChat);
router.delete('/brand/chat/delete/:id', auth, deleteUserChat);


// Route for replying to a message
router.post('/message/reply/:id', auth, replyMessage);

// Route for reacting to a message
router.post('/message/react/:id', auth, reactToMessage);

module.exports = router;
