const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const ChatSchema = new Schema({
  participantA: [
    {
      type: Schema.Types.ObjectId,
      refPath: 'participantAType', // Both influencers and brands can participate in the chat
    },
  ],
  participantAType: {
    type: String,
    required: true,
    enum: ['Brand', 'Influencer'],
  },
  participantB: [
    {
      type: Schema.Types.ObjectId,
      ref: 'participantBType', // Both influencers and brands can participate in the chat
    },
  ],

  participantBType: {
    type: String,
    required: true,
    enum: ['Brand', 'Influencer'],
  },
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Message', // Both influencers and brands can participate in the chat
    },
  ],
  blockedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],

},{timestamps:true});

const Chat = model('Chat', ChatSchema);
module.exports = Chat;
