const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN', 'DEPARTMENT'],
      default: 'USER',
    },
    // Only populated if role is DEPARTMENT
    departmentType: {
      type: String,
      enum: ['ROADS', 'WATER', 'GARBAGE', 'ELECTRICITY', 'OTHER'],
    },
    points: {
      type: Number,
      default: 0,
    },
    trustScore: {
      type: Number,
      default: 50, // 0-100 scale
      min: 0,
      max: 100,
    },
    reportsCount: {
      type: Number,
      default: 0,
    },
    falseReportsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
