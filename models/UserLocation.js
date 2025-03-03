// models/UserLocation.js
import mongoose from 'mongoose';

const userLocationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Optional for failed logins where user doesn't exist
    index: true
  },
  email: {
    type: String,
    // Store the attempted email for failed logins
    default: null
  },
  ip: {
    type: String,
    required: true
  },
  location: {
    country: {
      type: String,
      default: null
    },
    city: {
      type: String,
      default: null
    },
    region: {
      type: String,
      default: null
    },
    coordinates: {
      lat: {
        type: Number,
        default: null
      },
      lng: {
        type: Number,
        default: null
      }
    }
  },
  deviceInfo: {
    userAgent: {
      type: String,
      default: null
    },
    browser: {
      type: String,
      default: null
    },
    os: {
      type: String,
      default: null
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown'
    }
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'registration'],
    default: 'success'
  }
}, { timestamps: true });

// Index for efficient querying
userLocationSchema.index({ loginTime: -1 });
userLocationSchema.index({ userId: 1, loginTime: -1 });

export default mongoose.model('UserLocation', userLocationSchema);