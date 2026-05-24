// backend/models/Issue.js
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["roads", "water", "electricity", "sanitation", "parks", "other"],
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "rejected"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    location: {
      address: {
        type: String,
        required: [true, "Location address is required"],
        trim: true,
      },
      // Optional coordinates for map display
      lat: { type: Number },
      lng: { type: Number },
    },
    images: [
      {
        type: String, // file path or URL
      },
    ],
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    department: {
      type: String,
      enum: ["roads", "water", "electricity", "sanitation", "parks", "other"],
    },
    comments: [commentSchema],
    resolvedAt: {
      type: Date,
      default: null,
    },
    adminNote: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Auto-set department from category if not explicitly set
issueSchema.pre("save", function (next) {
  if (!this.department && this.category) {
    this.department = this.category;
  }
  if (this.status === "resolved" && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  next();
});

module.exports = mongoose.model("Issue", issueSchema);
