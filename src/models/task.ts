const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const TaskSchema = new Schema(
  {
    campaign: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    influencer: {
      type: Schema.Types.ObjectId,
      ref: 'Influencer',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['submitted', 'accepted', 'rejected', 'ignored'],
      default: 'submitted',
    },
    isComplete:{
      type: Boolean,
      default: false,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: String,
      required: ['duration is required'],
    },
    // price
    reward: {
      type: Number,
      required: true,
    },

    // additionalInfo: String,
    // attachments: [
    //   {
    //     link: String,
    //     _id: mongoose.Schema.Types.ObjectId,
    //     type: {
    //       type: String,
    //       enum: ['video', 'audio', 'image', 'application'],
    //     },
    //     file_extension: String,
    //   },
    // ], // URLs to files or media attached to the Task
  },
  {
    timestamps: true,
  },
);

const Task = model('Task', TaskSchema);
module.exports = Task;
