const Messagesdb = require('../../models/message');
const Chat = require('../../models/chat');
const { default: mongoose } = require('mongoose');
const Influencer = require('../../models/Influencer');
const Brand = require('../../models/brand');

//getting the directory outside controller
const dirnamearr = __dirname.split(`\\`);

//the create message controller

interface Media {
  link: string;
  id: any;
  type: 'video' | 'audio' | 'image';
}

const createMessage = async (req, res) => {
  console.log(req.body,"message body")
  try {
    if (req.filePaths && req.filePaths.length > 0) {
      console.log("Files attached to request:", req.filePaths);

      const mediaUrls = req.filePaths.map((file) => ({
        link: file.path,
        _id: new mongoose.Types.ObjectId(),
        type: file.mimetype.split('/')[0],
        file_extension: file.mimetype.split('/')[1],
      }));

      const { chatId, from, to, isReply, referenceChatId, ...others } = req.body;
      const message = new Messagesdb({
        ...others,
        from: new mongoose.Types.ObjectId(from),
        to: new mongoose.Types.ObjectId(to),
        mediaUrls,
        isReply: isReply || false,
        referenceChat: referenceChatId,
      });

      console.log("Saving message with media:", message);

      await message.save();
      const chat = await Chat.findById(chatId);

      if (chat) {
        chat.messages.push(message._id);
        await chat.save();
        console.log("Message created successfully");
        res.status(201).json({ message: 'Message created successfully' });
      } else {
        console.log("Chat not found");
        res.status(400).json({ message: 'Chat not found' });
      }
    } else {
      // If file is not attached to the request
      const { chatId, from, to, isReply, referenceChatId, ...others } = req.body;
      const message = new Messagesdb({
        ...others,
        from: new mongoose.Types.ObjectId(from),
        to: new mongoose.Types.ObjectId(to),
        isReply: isReply || false,
        referenceChat: referenceChatId,
      });

      console.log("Saving text message:", message);

      await message.save();
      await Chat.findByIdAndUpdate(chatId, { $push: { messages: message._id } });

      console.log("Text message created successfully");
      res.status(201).json({ message: 'Text message created successfully' });
    }
  } catch (error) {
    console.error("Message creation failed:", error);
    res.status(500).json({ message: 'Message creation not successful', error });
  }
};




//start a new chat
const createChat = async (req, res) => {
  try {
    const { participantAType, participantB, participantBType } = req.body;

    const participantA = req.user.id;

    console.log('participanst', participantA, participantB);
    console.log(req.body);
    if (participantA && participantB) {
      // Determine the model to use based on participant type
      const participantAModel =
        participantAType === 'Brand' ? Brand : Influencer;
      const participantBModel =
        participantAType === 'Brand' ? Brand : Influencer;

      // Check if the chat already exists
      const existingChat = await Chat.findOne({
        $or: [
          { participantA: participantA, participantB: participantB },
          { participantA: participantB, participantB: participantA },
        ],
      });

      if (existingChat) {
        return res
          .status(409)
          .json({ message: 'Chat already exists', chatId: existingChat._id });
      }

      // Create new chat
      const chat = new Chat({
        participantA,
        participantAType,
        participantB,
        participantBType,
      });

      await chat.save();

      // Add chat ID to both sender's and receiver's chat array
      await participantAModel.findOneAndUpdate(
        { _id: participantA },
        { $push: { chats: chat._id } },
      );
      await participantBModel.findOneAndUpdate(
        { _id: participantB },
        { $push: { chats: chat._id } },
      );

      res
        .status(201)
        .json({ message: 'Chat created successfully', chatId: chat._id });
    } else {
      res.status(400).json({ message: 'chat not created  no participant Ids' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'chat creation failed', error: error });
  }
};

// get all chats
const getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find({}).lean();
    res.status(200).json({ data: chats, message: 'request sucessful' });
  } catch (error) {
    res.status(404).json({ message: 'failed', error: error });
  }
};

const getUserChats = async (req, res) => {
  const userId = req.user.id; // Assume user's ID is retrieved from the session or JWT token

  try {
    const chats = await Chat.find({
      $or: [
        { participantA: new mongoose.Types.ObjectId(userId) },
        { participantB: new mongoose.Types.ObjectId(userId) },
      ],
    })
      .populate({
        path: 'messages',
        options: { sort: { createdAt: -1 }, limit: 1 }, // Sorting messages to get the latest one
        populate: { path: 'from to', select: 'name avatar' }, // Populating 'from' and 'to' fields
      })
      .exec();

    // Sort chats based on the createdAt of the latest message in descending order
    chats.sort((a, b) => {
      const createdAtA = a.messages[0] ? a.messages[0].createdAt : new Date(0);
      const createdAtB = b.messages[0] ? b.messages[0].createdAt : new Date(0);
      return createdAtB - createdAtA;
    });

    const chatDetailsPromises = chats.map(async (chat) => {
      let otherParticipantId, otherParticipant;

      // Determine the other participant
      if (chat.participantA.toString() === userId) {
        otherParticipantId = chat.participantB;
        otherParticipant =
          chat.participantBType === 'Brand'
            ? await Brand.findById(otherParticipantId).select('-password')
            : await Influencer.findById(otherParticipantId).select('-password');
      } else {
        otherParticipantId = chat.participantA;
        otherParticipant =
          chat.participantAType === 'Brand'
            ? await Brand.findById(otherParticipantId).select('-password')
            : await Influencer.findById(otherParticipantId).select('-password');
      }

      const lastMessage = chat.messages[0]; // Get the latest message from the populated messages array

      return {
        otherParticipantId,
        otherParticipant,
        avatar: otherParticipant?.avatar,
        lastMessage,
        chatId: chat._id,
        createdAt:chat.createdAt
      };
    });

    const chatDetails = await Promise.all(chatDetailsPromises);

    res.status(200).json({ data: chatDetails, message: 'chats fetched successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving user chats', error });
  }
};


const getMessages = async (req, res) => {
  const { id: chatId } = req.params;
  const { id: userId } = req.user;

  try {
    const chat = await Chat.findById(chatId).populate({
      path: 'messages',
      populate: { path: 'referenceChat', select: 'text from' }, // Populating details of replied-to messages
      options: { sort: { createdAt: -1 } }, // Sorting messages by creation time
    });

    if (!chat || !chat.messages) {
      return res.status(404).json({ message: 'No messages found in chat.' });
    }

    // Filter out messages marked as deleted for the receiver
    const visibleMessages = chat.messages.filter((message) => {
      // Check if the user is the receiver and the message is marked as deleted for the receiver
      return !(
        message.to.toString() === userId.toString() &&
        message.deletedForReceiver
      );
    });

    // Mark received messages as seen
    const messagesToUpdate = chat.messages.filter(
      (message) => message.to.toString() === userId.toString() && !message.seen,
    );

    if (messagesToUpdate.length) {
      await markMessagesAsSeen(messagesToUpdate.map((message) => message._id));
    }

    res.status(200).json({data:visibleMessages,message:"message sent sucessfully"});
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ message: 'Failed to retrieve messages', error });
  }
};

// Helper function to mark messages as seen
const markMessagesAsSeen = async (messageIds) => {
  try {
    await Messagesdb.updateMany(
      { _id: { $in: messageIds } },
      { $set: { seen: true } },
    );
  } catch (error) {
    console.error('Error marking messages as seen:', error);
  }
};

// delete a single message
async function deleteMessage(req, res) {
  const { messageId } = req.params;
  const userId = req.user.id; // Assuming user ID is available from authenticated session

  try {
    const message = await Messagesdb.findById(messageId);
    if (!message) {
      return res.status(404).send({ message: 'Message not found' });
    }

    // Check if the requester is the sender
    if (message.from.toString() === userId.toString()) {
      // Sender can delete the message entirely
      await Messagesdb.findByIdAndDelete(messageId);
      return res.send({ message: 'Message deleted successfully' });
    } else if (message.to.toString() === userId.toString()) {
      // Receiver can delete the message for themselves (soft delete)
      // For simplicity, let's assume we add a field `deletedForReceiver`
      await Messagesdb.findByIdAndUpdate(messageId, {
        $set: { deletedForReceiver: true },
      });
      return res
        .status(200)
        .send({ message: 'Message deleted for you successfully' });
    } else {
      return res
        .status(403)
        .send({ message: 'You do not have permission to delete this message' });
    }
  } catch (err) {
    console.error('Error deleting message:', err);
    return res.status(500).send({ message: 'Error deleting message' });
  }
}
// delete multiple messages
async function deleteMessages(req, res) {
  const messageIds = req.body.messageIds; // Expect an array of message IDs in the request body
  const userId = req.user.id; // Assuming user ID is available from authenticated session

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return res
      .status(400)
      .send({ message: 'Invalid input: expected an array of message IDs.' });
  }

  try {
    // Find messages by IDs
    const messages = await Messagesdb.find({ _id: { $in: messageIds } });

    if (messages.length === 0) {
      return res.status(404).send({ message: 'No messages found.' });
    }

    let deletedCount = 0;
    let softDeletedCount = 0;

    for (const message of messages) {
      // Check if the requester is the sender
      if (message.from.toString() === userId.toString()) {
        // Sender can delete the message entirely
        await Messagesdb.findByIdAndRemove(message._id);
        deletedCount++;
      } else if (message.to.toString() === userId.toString()) {
        // Receiver can delete the message for themselves (soft delete)
        await Messagesdb.findByIdAndUpdate(message._id, {
          $set: { deletedForReceiver: true },
        });
        softDeletedCount++;
      } else {
        // No action taken if the user is neither sender nor receiver
        return res.status(401).send({
          message: `You have no permmission to delete this message. message ID ${message._id}`,
        });
      }
    }

    return res.status(200).send({
      message: `Successfully deleted ${deletedCount} messages and soft-deleted ${softDeletedCount} messages.`,
    });
  } catch (err) {
    console.error('Error deleting messages:', err);
    return res.status(500).send({ message: 'Error deleting messages' });
  }
}

async function blockChat(req, res) {
  const { chatId } = req.params;
  const userId = req.user.id; // Assuming user ID is available from authenticated session

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).send({ message: 'Chat not found' });
    }

    // Check if the requester is one of the participants
    if (chat.participantA.equals(userId) || chat.participantB.equals(userId)) {
      // Block the chat by adding the userId to the blockedBy array if not already blocked
      if (!chat.blockedBy.includes(userId)) {
        chat.blockedBy.push(userId);
        await chat.save();
        return res.send({ message: 'Chat has been successfully blocked.' });
      } else {
        return res
          .status(400)
          .send({ message: 'You have already blocked this chat.' });
      }
    } else {
      return res
        .status(403)
        .send({ message: 'You do not have permission to block this chat' });
    }
  } catch (err) {
    console.error('Error blocking chat:', err);
    return res.status(500).send({ message: 'Error blocking chat' });
  }
}

//delete chats
const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedmessage = Chat.findByIdAndDelete(id);
    res.status(200).json({ message: 'success: chat deleted' });
  } catch (error) {
    res.status(500).json({ message: 'error: something went wrong', error });
  }
};

//delete user chats
const deleteUserChat = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const chat = await Chat.findById(id);
  const friendId = chat.members.filter((member) => {
    return member != userId;
  });
  if (userId && id) {
    try {
      await Influencer.updateOne({ _id: userId }, { $pull: { chats: id } });
      await Influencer.findOneAndUpdate(
        { _id: userId },
        { $pull: { friends: { friend: friendId } } },
        { new: true },
      );
      res.status(200).json({ message: 'success: chat deleted' });
    } catch (error) {
      res.status(500).json({ message: 'error: something went wrong', error });
    }
  } else {
    res.status(400).json({ message: 'error: invalid id' });
  }
};

const unBlockChat = async (req, res) => {
  const userId = req.user.id;
  const { friendId } = req.params;
  try {
    await Influencer.updateOne(
      { _id: userId },
      { $set: { 'friends.$[elem].blocked': false } },
      { arrayFilters: [{ 'elem.friend': friendId }] },
    );
    res.status(200).json({ message: 'user unblocked' });
  } catch (error) {
    res.status(500).json({ message: 'error: request unsucessful' });
  }
};

const updateMessage = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedmessage = await Messagesdb.findByIdAndUpdate(id, req.body);
  } catch (error) {
    res.send(error);
  }
};
const reactToMessage = async (req, res) => {
  const { id } = req.params;
  const { reaction, from } = req.body;
  try {
    const message = await Messagesdb.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          reactions: {
            reaction: reaction,
            from: mongoose.Types.ObjectId(from),
          },
        },
      },
    ).exec();
    res.status(201).send('reacted to message');
  } catch (error) {
    res.status(401).json({ message: 'unsucessful reply', error: error });
  }
};
const replyMessage = async (req, res) => {
  //id of the chat
  const { id } = req.params;

  const chatid = mongoose.Types.ObjectId(id);
  //id of the chat taht is being replied
  const { referenceid, from, to, ...others } = req.body;
  if (referenceid && from && to) {
    try {
      const message = new Messagesdb({
        ...others,
        from: mongoose.Types.ObjectId(from),
        to: mongoose.Types.ObjectId(to),
        refrenceChat: mongoose.Types.ObjectId(referenceid),
        isReply: true,
        //add refrenced chat to the reply
      });
      try {
        //add the reply to the refrenced chat
        const refrence = await Messagesdb.findOneAndUpdate(
          { _id: referenceid },
          { $push: { replies: message._id } },
        ).exec();
        await message.save(message);
        //save the reply as a message to the current chat
        await Chat.findOneAndUpdate(
          { _id: chatid },
          { $push: { messages: message._id } },
        ).exec();
        res.status(201).json({ message: 'message replied successfully' });
      } catch (error) {
        res.json({ message: 'reply creation is not successful', error });
      }
      res.status(201).send;
    } catch (error) {
      res.send(error);
    }
  } else {
    res.status(400).json({ message: 'reply failed' });
  }
};

module.exports = {
  deleteChat,
  deleteUserChat,
  replyMessage,
  reactToMessage,
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
};
