// backend/controllers/departmentController.js
const Issue = require("../models/Issue");
const User = require("../models/User");

// ─── GET /api/department/issues ───────────────────────────────────────────────
// Department sees only their own department's issues
const getDepartmentIssues = async (req, res) => {
  const { status, priority, page = 1, limit = 10 } = req.query;

  // BUG FIX: req.user.department was never checked — dept users saw all issues
  if (!req.user.department) {
    return res.status(400).json({
      success: false,
      message: "No department assigned to this account.",
    });
  }

  const filter = { department: req.user.department };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Issue.countDocuments(filter);

  const issues = await Issue.find(filter)
    .populate("reportedBy", "name email phone")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    department: req.user.department,
    count: issues.length,
    total,
    totalPages: Math.ceil(total / Number(limit)),
    currentPage: Number(page),
    issues,
  });
};

// ─── PUT /api/department/issues/:id/status ─────────────────────────────────────
const updateIssueStatus = async (req, res) => {
  const { status, adminNote } = req.body;

  const allowedStatuses = ["in_progress", "resolved", "rejected"];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
    });
  }

  const issue = await Issue.findById(req.params.id);

  if (!issue) {
    return res
      .status(404)
      .json({ success: false, message: "Issue not found." });
  }

  // BUG FIX: dept users could update issues from other departments
  if (issue.department !== req.user.department) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update issues outside your department.",
    });
  }

  issue.status = status;
  if (adminNote) issue.adminNote = adminNote;
  if (status === "resolved") issue.resolvedAt = new Date();

  await issue.save();

  const updated = await Issue.findById(issue._id)
    .populate("reportedBy", "name email")
    .populate("assignedTo", "name email");

  res.status(200).json({ success: true, issue: updated });
};

// ─── GET /api/department/stats ─────────────────────────────────────────────────
const getDepartmentStats = async (req, res) => {
  if (!req.user.department) {
    return res.status(400).json({
      success: false,
      message: "No department assigned to this account.",
    });
  }

  const dept = req.user.department;

  const [total, pending, inProgress, resolved, rejected] = await Promise.all([
    Issue.countDocuments({ department: dept }),
    Issue.countDocuments({ department: dept, status: "pending" }),
    Issue.countDocuments({ department: dept, status: "in_progress" }),
    Issue.countDocuments({ department: dept, status: "resolved" }),
    Issue.countDocuments({ department: dept, status: "rejected" }),
  ]);

  res.status(200).json({
    success: true,
    department: dept,
    stats: { total, pending, in_progress: inProgress, resolved, rejected },
  });
};

// ─── POST /api/department/issues/:id/proof ────────────────────────────────────
const uploadProof = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No proof files provided.",
    });
  }

  const issue = await Issue.findById(req.params.id);

  if (!issue) {
    return res.status(404).json({
      success: false,
      message: "Issue not found.",
    });
  }

  // Department can only upload proof for their own department's issues
  if (issue.department !== req.user.department) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to upload proof for this issue.",
    });
  }

  // Add proof files
  const proofFiles = req.files.map((f) => ({
    filename: f.filename,
    path: `/uploads/${f.filename}`,
    uploadedAt: new Date(),
  }));

  if (!issue.proof) issue.proof = [];
  issue.proof.push(...proofFiles);

  await issue.save();

  const updated = await Issue.findById(issue._id)
    .populate("reportedBy", "name email")
    .populate("assignedTo", "name email");

  res.status(200).json({
    success: true,
    message: "Proof uploaded successfully.",
    issue: updated,
  });
};

// ─── GET /api/department/activity ──────────────────────────────────────────────
const getDepartmentActivity = async (req, res) => {
  const ActivityLog = require("../models/ActivityLog");

  if (!req.user.department) {
    return res.status(400).json({
      success: false,
      message: "No department assigned to this account.",
    });
  }

  // Get all issues for this department to find their IDs
  const departmentIssues = await Issue.find({
    department: req.user.department,
  }).select("_id");

  const issueIds = departmentIssues.map((issue) => issue._id);

  const logs = await ActivityLog.find({ issueId: { $in: issueIds } })
    .populate("performedBy", "name email role")
    .populate("issueId", "title category status")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    department: req.user.department,
    count: logs.length,
    logs,
  });
};

module.exports = {
  getDepartmentIssues,
  updateIssueStatus,
  getDepartmentStats,
  uploadProof,
  getDepartmentActivity,
};
