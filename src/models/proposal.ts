const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const ProposalSchema = new Schema(
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
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    title: {
      type: String,
      required: true,
    },
    coverLetter: {
      type: String,
      required: true,
    },
    paymentMode: {
      type: String,
      enum: ['onCompletion', 'task_based'],
      required: true,
      default: 'onCompletion',
    },
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    status: {
      type: String,
      enum: ['submitted', 'accepted', 'rejected', 'ignored'],
      default: 'submitted',
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
    price: {
      amount: { type: Number, required: true },
      period: {
        type: String,
        enum: ['hourly', 'fixed'],
        required: true,
      },
    },
    // additionalInfo: String,
    attachments: [
      {
        link: String,
        _id: mongoose.Schema.Types.ObjectId,
        type: {
          type: String,
          enum: ['video', 'audio', 'image', 'application'],
        },
        file_extension: String,
      },
    ], // URLs to files or media attached to the proposal
  },
  {
    timestamps: true,
  },
);

const Proposal = model('Proposal', ProposalSchema);
module.exports = Proposal;
