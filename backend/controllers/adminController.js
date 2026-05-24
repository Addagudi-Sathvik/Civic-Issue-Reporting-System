// backend/controllers/adminController.js
const User = require("../models/User");
const Issue = require("../models/Issue");
const ActivityLog = require("../models/ActivityLog");

// ─── GET /api/admin/issues ────────────────────────────────────────────────────
// Admin gets all issues with filters
const getIssuesForAdmin = async (req, res) => {
  try {
    const { status, priority, category, verificationStatus, page = 1, limit = 100 } = req.query;

    const filter = {};
    if (status) filter.status = String(status).toLowerCase();
    if (priority) filter.priority = String(priority).toLowerCase();
    if (category) filter.category = String(category).toLowerCase();
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Issue.countDocuments(filter);

    const issues = await Issue.find(filter)
      .populate("reportedBy", "name email phone")
      .populate("assignedTo", "name email department")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    console.log("Issues fetched:", issues.length);

    res.status(200).json({
      success: true,
      count: issues.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      issues,
    });
  } catch (error) {
    console.log("Backend fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin issues.",
      error: error.message,
    });
  }
};

// ─── GET /api/admin/issues/:id ────────────────────────────────────────────────
// Get detailed issue info with activity logs
const getIssueDetail = async (req, res) => {
  const issue = await Issue.findById(req.params.id)
    .populate("reportedBy", "name email phone")
    .populate("assignedTo", "name email department")
    .populate("comments.user", "name role email");

  if (!issue) {
    return res.status(404).json({
      success: false,
      message: "Issue not found.",
    });
  }

  const logs = await ActivityLog.find({ issueId: req.params.id })
    .populate("performedBy", "name email role")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    issue,
    activityLogs: logs,
  });
};

// ─── POST /api/admin/approve ──────────────────────────────────────────────────
const approveIssue = async (req, res) => {
  const { issueId } = req.body;

  const issue = await Issue.findById(issueId);

  if (!issue) {
    return res.status(404).json({
      success: false,
      message: "Issue not found.",
    });
  }

  issue.status = "pending";
  issue.verifiedAt = new Date();
  issue.verifiedBy = req.user._id;

  await issue.save();

  await ActivityLog.create({
    issueId: issue._id,
    action: "APPROVED",
    performedBy: req.user._id,
    remarks: "Issue approved by admin",
  });

  const updated = await Issue.findById(issue._id)
    .populate("reportedBy", "name email")
    .populate("verifiedBy", "name email");

  res.status(200).json({ success: true, issue: updated });
};

// ─── POST /api/admin/reject ───────────────────────────────────────────────────
const rejectIssue = async (req, res) => {
  const { issueId, reason } = req.body;

  const issue = await Issue.findById(issueId);

  if (!issue) {
    return res.status(404).json({
      success: false,
      message: "Issue not found.",
    });
  }

  issue.status = "rejected";
  issue.rejectionReason = reason || "Rejected by admin";
  issue.rejectedAt = new Date();
  issue.rejectedBy = req.user._id;

  await issue.save();

  await ActivityLog.create({
    issueId: issue._id,
    action: "REJECTED",
    performedBy: req.user._id,
    remarks: reason || "Rejected by admin",
  });

  const updated = await Issue.findById(issue._id)
    .populate("reportedBy", "name email")
    .populate("rejectedBy", "name email");

  res.status(200).json({ success: true, issue: updated });
};

// ─── POST /api/admin/assign ───────────────────────────────────────────────────
// Assign issue to department or user
const assignDepartment = async (req, res) => {
  const { issueId, assignedTo, department, priority } = req.body;

  const issue = await Issue.findById(issueId);

  if (!issue) {
    return res.status(404).json({
      success: false,
      message: "Issue not found.",
    });
  }

  // Validate the assignee is a department user
  if (assignedTo) {
    const assignee = await User.findById(assignedTo);
    if (!assignee || assignee.role !== "department") {
      return res.status(400).json({
        success: false,
        message: "Assignee must be a valid department user.",
      });
    }
  }

  issue.assignedTo = assignedTo || null;
  issue.department = department || issue.department;
  issue.priority = priority || issue.priority;
  issue.status = "in_progress";

  await issue.save();

  await ActivityLog.create({
    issueId: issue._id,
    action: "ASSIGNED",
    performedBy: req.user._id,
    remarks: `Assigned to ${assignedTo ? "user" : "department"}: ${department}`,
    metadata: { assignedTo, department },
  });

  const updated = await Issue.findById(issue._id)
    .populate("reportedBy", "name email")
    .populate("assignedTo", "name email department");

  res.status(200).json({ success: true, issue: updated });
};

// ─── GET /api/admin/department-users ──────────────────────────────────────────
const getDepartmentUsers = async (req, res) => {
  const { department, page = 1, limit = 20 } = req.query;

  const filter = { role: "department" };
  if (department) filter.department = department;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(filter);

  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    totalPages: Math.ceil(total / Number(limit)),
    currentPage: Number(page),
    users,
  });
};

// ─── GET /api/admin/stats ────────────────────────────────────────────────────
const getAdminStats = async (req, res) => {
  const [
    totalIssues,
    pendingIssues,
    inProgressIssues,
    resolvedIssues,
    rejectedIssues,
    totalUsers,
    citizenCount,
    departmentCount,
    issuesByCategory,
    recentIssues,
  ] = await Promise.all([
    Issue.countDocuments(),
    Issue.countDocuments({ status: "pending" }),
    Issue.countDocuments({ status: "in_progress" }),
    Issue.countDocuments({ status: "resolved" }),
    Issue.countDocuments({ status: "rejected" }),
    User.countDocuments(),
    User.countDocuments({ role: "citizen" }),
    User.countDocuments({ role: "department" }),
    Issue.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Issue.find()
      .populate("reportedBy", "name")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title status category createdAt"),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      issues: {
        total: totalIssues,
        pending: pendingIssues,
        in_progress: inProgressIssues,
        resolved: resolvedIssues,
        rejected: rejectedIssues,
      },
      users: {
        total: totalUsers,
        citizens: citizenCount,
        departments: departmentCount,
      },
      issuesByCategory,
      recentIssues,
    },
  });
};

module.exports = {
  getIssuesForAdmin,
  getIssueDetail,
  approveIssue,
  rejectIssue,
  assignDepartment,
  getAdminStats,
  getDepartmentUsers,
};
