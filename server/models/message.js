const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read'],
    default: 'sent'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  deliveredAt: {
    type: Date,
    default: null,
    index: true  // For querying undelivered messages efficiently
  },
  readAt: {
    type: Date,
    default: null
  },
  // For handling temporary offline storage and syncing
  clientId: {
    type: String,
    sparse: true  // Index only non-null values
  }
}, {
  timestamps: true
});

// Compound index for efficient pagination within rooms
messageSchema.index({ roomId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;