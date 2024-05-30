const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const MessageSchema = new Schema(
  {
    from: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'fromType'
    },
    fromType: {
      type: String,
      required: true,
      enum: ['Brand', 'Influencer']
    },
    to: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'toType'
    },
    toType: {
      type: String,
      required: true,
      enum: ['Brand', 'Influencer']
    },
    text: {
      type: String,
      required: true,
    },
    mediaUrls: [{
      _id: false,
      link: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true,
        enum: ['video', 'audio', 'image', 'application']
      },
      file_extension: {
        type: String,
        required: true
      }
    }],
    isReply: {
      type: Boolean,
      default: false
    },
    referenceChat: {
      type: Schema.Types.ObjectId,
      ref: 'Message' // Reference to another message if this is a reply
    },

    // boolean to set if message has been seen by reciever
    seen:{
      type:Boolean,
      default:false
    },

    // 
    deletedForReceiver:{
      type:Boolean,
      default:false
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes to improve performance on frequently queried fields
MessageSchema.index({ from: 1, to: 1, isReply: 1 });

const Message = model('Message', MessageSchema);

module.exports = Message;
