const mongoose = require('mongoose');

const confirmationSchema = new mongoose.Schema(
  {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    confidence: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate confirmations
confirmationSchema.index({ issueId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Confirmation', confirmationSchema);