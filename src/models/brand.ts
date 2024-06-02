const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const brandSchema = new Schema({
  name: {
    type: String,
    required: [true, 'brand name is compulsory'],
  },
  email: {
    type: String,
    required: [true, 'brand email is compulsory'],
    unique: true,
  },
  phone: {
    type: String,
    required: [true, 'brand phone is compulsory'],
  },
  password: {
    type: String,
    required: [true, 'account password is compulsory'],
  },
  countryCode: { type: String },
  nationality: { type: String },
  address: {
    state: String,
    city: String,
    residentialAddress: String,
  },
  email_verified: { type: Boolean, default: false },
  interests: [String],
  about: { type: String },
  companyRegistrationId: {
    type: String,
  },
  // brands social handles
  socials: [
    {
      platform: {
        type: String,
        // unique:[true,"You can only fill one link for one social media platform"],
        enum: ['instagram', 'facebook', 'twitter', 'tiktok'],
      },
      link: String,
      isVerified: {
        type: Boolean,
        default: false,
      },
    },
  ],
  chats: [{ type: mongoose.Types.ObjectId, ref: 'Chats' }],
  // campaign history subschema
  campaignHistory: [
    {
      campaign: {
        type: mongoose.Types.ObjectId,
        ref: 'Campaign',
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'canceled'],
      },
    },
  ],
  avatar: { type: String },
  subscription: {
    type: mongoose.Types.ObjectId,
    ref: 'Subscription',
  },
  // birthDate: { type: String },
  isSuspended: { type: Boolean, default: false },
  pushObject: {
    token: {
      type: String,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    latestTicket: String,
  },
  profileCreated: { type: Boolean, default: false },
  kycCompleted: {
    type: Boolean,
    default: false,
  },

  // this field represents the type of user
  accountType: {
    type: String,
    default: 'Brand',
  },
});



module.exports = mongoose.models.Brand||model('Brand', brandSchema);
