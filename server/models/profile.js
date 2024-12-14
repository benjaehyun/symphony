const mongoose = require('mongoose');

const PROFILE_STATUS = {
    NOT_STARTED: 'NOT_STARTED',
    BASIC_INFO_COMPLETED: 'BASIC_INFO_COMPLETED',
    PHOTOS_UPLOADED: 'PHOTOS_UPLOADED',
    MUSIC_CONNECTED: 'MUSIC_CONNECTED',
    COMPLETED: 'COMPLETED'
  };

  const photoSchema = new mongoose.Schema({
    url: {
      type: String,
      required: true,
      trim: true
    },
    key: {
      type: String,
      required: true,
      trim: true
    },
    order: {
      type: Number,
      required: true,
      min: 0
    }
  }, { _id: true });

const audioFeaturesSchema = new mongoose.Schema({
  danceability: { type: Number, min: 0, max: 1 },
  energy: { type: Number, min: 0, max: 1 },
  acousticness: { type: Number, min: 0, max: 1 },
  instrumentalness: { type: Number, min: 0, max: 1 },
  valence: { type: Number, min: 0, max: 1 }
});

const musicDimensionsSchema = new mongoose.Schema({
  mellow: { type: Number, min: 0, max: 1 },
  unpretentious: { type: Number, min: 0, max: 1 },
  sophisticated: { type: Number, min: 0, max: 1 },
  intense: { type: Number, min: 0, max: 1 },
  contemporary: { type: Number, min: 0, max: 1 }
});

const artistSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  genres: [{
    type: String
  }]
}, { _id: false });

const trackSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  artists: [artistSchema],
  features: audioFeaturesSchema
}, { _id: false });

const matchSchema = new mongoose.Schema({
  matchedProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  matchedAt: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  },
  lastInteractionAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'unmatch_pending', 'unmatched'],
    default: 'active'
  }
});

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Basic Info
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 100
  },
  gender: {
    type: String,
    required: true,
    enum: ['man', 'woman', 'non-binary', 'other']
  },
  bio: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },

  // Photos
  photos: [photoSchema],

  // Music Profile
  music: {
    sourceType: {
      type: String,
      enum: ['playlist', 'top_tracks'],
      required: true
    },
    sourceId: {
      type: String,
      required: true
    },
    tracks: [trackSchema],
    analysis: {
      averageFeatures: audioFeaturesSchema,
      genreDistribution: {
        type: Map,
        of: Number,
        default: new Map()
      },
      musicDimensions: musicDimensionsSchema
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },

  // Preferences
  preferences: {
    genderPreference: [{
      type: String,
      enum: ['man', 'woman', 'non-binary', 'other']
    }],
    ageRange: {
      min: {
        type: Number,
        min: 18,
        max: 100,
        required: true
      },
      max: {
        type: Number,
        min: 18,
        max: 100,
        required: true
      }
    },
    maxDistance: {
      type: Number,
      min: 1,
      max: 150,
      required: true
    }
  },

  // Profile Status
  status: {
    type: String,
    enum: Object.values(PROFILE_STATUS),
    default: PROFILE_STATUS.NOT_STARTED
  },

  // Matching Data
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  }],
  matches: [matchSchema],

  // Location (for distance-based matching)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  }
}, {
  timestamps: true
});

// Indexes
profileSchema.index({ location: '2dsphere' }); // For geo queries
profileSchema.index({ user: 1 }); // For quick user lookups
profileSchema.index({ 'music.sourceId': 1 }); // For music queries

// Methods
profileSchema.methods.isComplete = function() {
  return (
    this.name &&
    this.age &&
    this.gender &&
    this.bio &&
    this.photos.length > 0 &&
    this.music.sourceId &&
    this.preferences.genderPreference.length > 0
  );
};

profileSchema.methods.updateStatus = function() {
  if (this.isComplete()) {
    this.status = PROFILE_STATUS.COMPLETED;
  } else if (this.music.sourceId) {
    this.status = PROFILE_STATUS.MUSIC_CONNECTED;
  } else if (this.photos.length > 0) {
    this.status = PROFILE_STATUS.PHOTOS_UPLOADED;
  } else if (this.name && this.age) {
    this.status = PROFILE_STATUS.BASIC_INFO_COMPLETED;
  } else {
    this.status = PROFILE_STATUS.NOT_STARTED;
  }
};

// Pre save middleware
profileSchema.pre('save', function(next) {
  this.updateStatus();
  next();
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
module.exports.PROFILE_STATUS = PROFILE_STATUS;
