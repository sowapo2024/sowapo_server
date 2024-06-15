const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const AdCampaignSchema = new Schema(
  {

    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    // current status of the campaign
    status: {
      type: String,
      enum: ['active', 'completed', 'pending'],
      default: 'pending',
    },

    // is campaign suspended?

    isSuspended: {
      type: Boolean,
      default: false,
    },

    // is campaign approved
    isApproved: {
      type: Boolean,
      default: false,
    },

    // the brand sponsoring the campaign
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'camapain must be sponsored by a brand'],
    },

    // budget
    budget: {
      amount: { type: Number, required: true },
      period: {
        type: String,
        enum: ['hourly', 'fixed',"weekly"],
        required: true,
      },
    },

    // the proposed total budget for the campaign
    totalBudget: {
      type: Number,
      required: true,
    },

    // The available budget at any moment
    availableBalance: {
      type: Number,
      // required: true,
    },

    // 
    expenditure: {
      type: Number,
      // required: true,
    },

    paymentVerified: {
      type: Boolean,
      default: false,
    },


    // boolean field that indiates whether brand is still hiring or not
    // if this field is true, the camapaign will be public and accepting proposals 
    hiring:{
      type: Boolean,
      default: true,
    },
    // // max hires
    // maxHires:{
    //   type:Number,
    //   default:1
    // },

    //   proposlas from the inflencers
    proposals: [{ type: Schema.Types.ObjectId, ref: 'Proposal' }],

    handlesToTag: [String],
    hashTags: [String],
    campaignDeliverables: [String],
    campaignObjectives: [String],

    // demography
    targetAudience: {
      ageRange: {
        min: Number,
        max: Number,
      },
      locations: [String],
      interests: [String],
      gender: {
        type: String,
        enum: ['male', 'female', 'all'],
        default: 'all',
      },
    },

    // hires
    hires: [
      {
        influencer: { type: Schema.Types.ObjectId, ref: 'Influencer' },
        status: {
          type: String,
          enum: ['hired', 'pending', 'revoked'],
          default: 'pending',
        },
      },
    ],

    // channels to post
    channels: [
      {
        type: String,
        enum: [
          'facebook',
          'google',
          'instagram',
          'twitter',
          'linkedin',
          'other',
        ],
      },
    ],

    // additionalInfo: String,
    attachmentUrls: [
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
    keywords:[String],

    // ad metrics
    performanceMetrics: {
      impressions: {
        type: Number,
        default: 0,
      },
      clicks: {
        type: Number,
        default: 0,
      },
      conversions: {
        type: Number,
        default: 0,
      },
      spend: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);


// Create text index for full-text search
AdCampaignSchema.index({ title: 'text', description: 'text', keywords: 'text' });

const Campaign = model('Campaign', AdCampaignSchema);
module.exports = Campaign;
