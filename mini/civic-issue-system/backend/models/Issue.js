const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['ROADS', 'WATER', 'GARBAGE', 'ELECTRICITY', 'OTHER'],
      required: true,
    },
    location: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
      address: {
        type: String,
      },
    },
    media: [
      {
        type: String, // URLs of images/videos
      },
    ],
    status: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'],
      default: 'PENDING_VERIFICATION',
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    verificationType: {
      type: String,
      enum: ['AI', 'ADMIN', 'CROWD'],
      default: null,
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 100,
    },
    assignedDepartment: {
      type: String,
      enum: ['ROADS', 'WATER', 'GARBAGE', 'ELECTRICITY', 'OTHER'],
    },
    adminRemarks: {
      type: String,
    },
    departmentRemarks: [{
      message: String,
      timestamp: { type: Date, default: Date.now },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userRole: String,
    }],
    rejectionReason: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
    assignedAt: {
      type: Date,
    },
    inProgressAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'LOW',
    },
    votes: {
      type: Number,
      default: 0,
    },
    voters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    proofOfCompletion: [
      {
        type: String,
      },
    ],
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Issue', issueSchema);
