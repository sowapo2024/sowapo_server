const mongoose = require('mongoose');

const devotionalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    bible_verse: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
      unique:true,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comments',
      },
    ],
    content: {
      type: String,
      required: true,
    },
    media_url: {
      type: String,
    },
    views: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        time: {
          type: Date,
        },
      },
    ],
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        time: {
          type: Date,
        },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model('Devotional', devotionalSchema);
