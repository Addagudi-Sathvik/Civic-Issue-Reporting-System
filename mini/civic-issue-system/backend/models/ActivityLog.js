const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'CREATED',
        'AI_VALIDATED',
        'CROWD_CONFIRMED',
        'ADMIN_APPROVED',
        'ADMIN_REJECTED',
        'DEPARTMENT_ASSIGNED',
        'STATUS_UPDATED',
        'RESOLVED',
        'VOTE_ADDED',
        'COMMENT_ADDED'
      ],
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    oldStatus: {
      type: String,
    },
    newStatus: {
      type: String,
    },
    remarks: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // For additional data like AI confidence, department type, etc.
    },
  },
  { timestamps: true }
);

// Index for efficient querying
activityLogSchema.index({ issueId: 1, createdAt: -1 });
activityLogSchema.index({ performedBy: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);