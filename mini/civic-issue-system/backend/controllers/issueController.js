// backend/controllers/issueController.js
const Issue = require("../models/Issue");
const User = require("../models/User");

// ─── GET /api/issues  ─────────────────────────────────────────────────────────
// Citizen: sees only their own issues
// Department: sees issues in their department
// Admin: sees all issues
const getIssues = async (req, res) => {
  const { status, category, priority, page = 1, limit = 10 } = req.query;

  // BUG FIX: original code had no role filtering — citizens could see all issues
  let filter = {};

  if (req.user.role === "citizen") {
    filter.reportedBy = req.user._id;
  } else if (req.user.role === "department") {
    if (!req.user.department) {
      return res.status(400).json({
        success: false,
        message: "Department user has no department assigned.",
      });
    }
    filter.department = req.user.department;
  }
  // admin: no filter — sees all

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Issue.countDocuments(filter);

  const issues = await Issue.find(filter)
    .populate("reportedBy", "name email")
    .populate("assignedTo", "name email department")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    count: issues.length,
    total,
    totalPages: Math.ceil(total / Number(limit)),
    currentPage: Number(page),
    issues,
  });
};

// ─── GET /api/issues/:id ──────────────────────────────────────────────────────
const getIssueById = async (req, res) => {
  const issue = await Issue.findById(req.params.id)
    .populate("reportedBy", "name email phone")
    .populate("assignedTo", "name email department")
    .populate("comments.user", "name role");

  if (!issue) {
    return res
      .status(404)
      .json({ success: false, message: "Issue not found." });
  }

  // BUG FIX: citizens can only view their own issues
  if (
    req.user.role === "citizen" &&
    issue.reportedBy._id.toString() !== req.user._id.toString()
  ) {
    return res
      .status(403)
      .json({ success: false, message: "Not authorized to view this issue." });
  }

  // Department can only view issues in their department
  if (
    req.user.role === "department" &&
    issue.department !== req.user.department
  ) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to view issues outside your department.",
    });
  }

  res.status(200).json({ success: true, issue });
};

// ─── POST /api/issues ─────────────────────────────────────────────────────────
const createIssue = async (req, res) => {
  const { title, description, category, priority, location } = req.body;

  // BUG FIX: location was expected as object but form sends flat fields
  // Support both JSON body and form-data with location.address
  let parsedLocation = location;
  if (typeof location === "string") {
    try {
      parsedLocation = JSON.parse(location);
    } catch {
      // If it's just a plain string, treat as address
      parsedLocation = { address: location };
    }
  }

  if (!parsedLocation || !parsedLocation.address) {
    return res.status(400).json({
      success: false,
      message: "Location address is required.",
    });
  }

  // Handle uploaded image files
  const images = req.files
    ? req.files.map((f) => `/uploads/${f.filename}`)
    : [];

  const issue = await Issue.create({
    title,
    description,
    category,
    priority: priority || "medium",
    location: parsedLocation,
    images,
    reportedBy: req.user._id,
    department: category, // auto-map category → department
  });

  const populated = await Issue.findById(issue._id).populate(
    "reportedBy",
    "name email"
  );

  res.status(201).json({ success: true, issue: populated });
};

// ─── PUT /api/issues/:id ──────────────────────────────────────────────────────
const updateIssue = async (req, res) => {
  let issue = await Issue.findById(req.params.id);

  if (!issue) {
    return res
      .status(404)
      .json({ success: false, message: "Issue not found." });
  }

  const { role, _id, department } = req.user;

  // BUG FIX: no ownership / role checks in original update
  if (role === "citizen") {
    // Citizens can only edit their own pending issues
    if (issue.reportedBy.toString() !== _id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to edit this issue." });
    }
    if (issue.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit an issue that is no longer pending.",
      });
    }
    // Citizens can only update these fields
    const { title, description, location } = req.body;
    issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { title, description, location },
      { new: true, runValidators: true }
    );
  } else if (role === "department") {
    // Department can only update status/comments for their dept issues
    if (issue.department !== department) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update issues outside your department.",
      });
    }
    const { status, adminNote } = req.body;
    const allowedStatuses = ["in_progress", "resolved", "rejected"];
    if (status && !allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value." });
    }
    issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { ...(status && { status }), ...(adminNote && { adminNote }) },
      { new: true, runValidators: true }
    );
  } else if (role === "admin") {
    // Admin can update anything
    issue = await Issue.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
  }

  res.status(200).json({ success: true, issue });
};

// ─── DELETE /api/issues/:id ───────────────────────────────────────────────────
const deleteIssue = async (req, res) => {
  const issue = await Issue.findById(req.params.id);

  if (!issue) {
    return res
      .status(404)
      .json({ success: false, message: "Issue not found." });
  }

  // BUG FIX: no ownership check — anyone could delete any issue
  if (
    req.user.role === "citizen" &&
    issue.reportedBy.toString() !== req.user._id.toString()
  ) {
    return res
      .status(403)
      .json({ success: false, message: "Not authorized to delete this issue." });
  }

  // Only citizens (own issues) and admins can delete
  if (req.user.role === "department") {
    return res.status(403).json({
      success: false,
      message: "Department users cannot delete issues.",
    });
  }

  await issue.deleteOne();
  res
    .status(200)
    .json({ success: true, message: "Issue deleted successfully." });
};

// ─── POST /api/issues/:id/comments ────────────────────────────────────────────
const addComment = async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Comment text is required." });
  }

  const issue = await Issue.findById(req.params.id);

  if (!issue) {
    return res
      .status(404)
      .json({ success: false, message: "Issue not found." });
  }

  // Citizens can only comment on their own issues
  if (
    req.user.role === "citizen" &&
    issue.reportedBy.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to comment on this issue.",
    });
  }

  issue.comments.push({ user: req.user._id, text: text.trim() });
  await issue.save();

  const updated = await Issue.findById(req.params.id).populate(
    "comments.user",
    "name role"
  );

  res.status(201).json({ success: true, comments: updated.comments });
};

// ─── GET /api/issues/stats ────────────────────────────────────────────────────
// Admin/department dashboard stats
const getStats = async (req, res) => {
  let matchFilter = {};

  if (req.user.role === "department") {
    matchFilter.department = req.user.department;
  } else if (req.user.role === "citizen") {
    matchFilter.reportedBy = req.user._id;
  }

  const [statusStats, categoryStats, totalCount] = await Promise.all([
    Issue.aggregate([
      { $match: matchFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Issue.aggregate([
      { $match: matchFilter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
    Issue.countDocuments(matchFilter),
  ]);

  // Normalize status stats into a flat object
  const byStatus = { pending: 0, in_progress: 0, resolved: 0, rejected: 0 };
  statusStats.forEach(({ _id, count }) => {
    if (_id in byStatus) byStatus[_id] = count;
  });

  res.status(200).json({
    success: true,
    stats: {
      total: totalCount,
      byStatus,
      byCategory: categoryStats,
    },
  });
};

module.exports = {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  addComment,
  getStats,
};
