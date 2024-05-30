const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InfluencerSchema = new Schema(
  {
    // personal info
    username: {
      type: String,
      unique: true,
      default: `${String(Math.random() * Date.now()).slice(0, 5)}`,
    },
    password: { type: String, required: [true, 'password must be provided'] },
    firstName: {
      type: String,
      required: [true, 'first name must be provided'],
    },
    lastName: { type: String, required: [true, 'last name must be provided'] },
    phone: { type: String },
    countryCode: { type: String },
    email: {
      type: String,
      unique: true,
      required: [true, 'email must be provided'],
    },

    email_verified: { type: Boolean, default: false },

    // profile info
    interests: [String],
    monthlyIncomeRange: {
      type:String,
    },
    about: { type: String },

    gender: { type: String },
    nationality: { type: String },
    address: {
      state:String,
      city:String,
      residentialAddress:String
    },
    avatar: { type: String },
    birthDate: { type: String },
    profileCreated: { type: Boolean, default: false },

    // subsription object

    subscription: {
      type: mongoose.Types.ObjectId,
      ref: 'Subscription',
    },

    // influencer social handles
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
    chats: [{ type: mongoose.Types.ObjectId, ref: 'Chats' }],

    //   proposlas from the inflencers
    proposals: [{ type: Schema.Types.ObjectId, ref: 'Proposal' }],

    isSuspended: { type: Boolean, default: false },

    // push notification token
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
    kycCompleted: {
      type: Boolean,
      default: false,
    },

    // this field represents the type of user
    accountType : {
      type:String,
      default:"Influencer"
    },

    // bank information for withdrawals
    bankDetails: {
      bankName: {
        type: String,
      },
      bankCode: {
        type: String,
      },
      bankType: {
        type: String,
      },
      bvn: {
        type: String,
      },
      accounNumber: {
        type: String,
      },
      withdrawalPin: {
        type: String,
      },
      paystackRecipientId: {
        type: String,
      },
    },
    blackList:[{
      type: Schema.Types.ObjectId
    }],
    // wallet balance
    wallet: {
      balance: {
        type: Number,
        default: 0,
      },
    },
    ratings:[{
      stars:Number,
      comment:String
    }],
    rating:{
      type:Number,
      default:0
    }
  },
  { timestamps: true },
);

const Inflencer = mongoose.model('Influencer', InfluencerSchema);
module.exports = Inflencer;
