// backend/controllers/adminController.js
const User = require("../models/User");
const Issue = require("../models/Issue");

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;

  const filter = role ? { role } : {};
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

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────
const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "User not found." });
  }

  res.status(200).json({ success: true, user });
};

// ─── POST /api/admin/users ────────────────────────────────────────────────────
// Admin creates new users (including department/admin users)
const createUser = async (req, res) => {
  const { name, email, password, role, department, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and password are required.",
    });
  }

  if (role === "department" && !department) {
    return res.status(400).json({
      success: false,
      message: "Department is required for department users.",
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res
      .status(400)
      .json({ success: false, message: "Email already registered." });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || "citizen",
    department: role === "department" ? department : null,
    phone,
  });

  res.status(201).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
};

// ─── PUT /api/admin/users/:id ─────────────────────────────────────────────────
const updateUser = async (req, res) => {
  const { name, email, role, department, phone, isActive } = req.body;

  // Prevent admin from demoting themselves
  if (
    req.params.id === req.user._id.toString() &&
    role &&
    role !== "admin"
  ) {
    return res.status(400).json({
      success: false,
      message: "Admin cannot change their own role.",
    });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(role !== undefined && { role }),
      ...(department !== undefined && { department }),
      ...(phone !== undefined && { phone }),
      ...(isActive !== undefined && { isActive }),
    },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "User not found." });
  }

  res.status(200).json({ success: true, user });
};

// ─── DELETE /api/admin/users/:id ──────────────────────────────────────────────
const deleteUser = async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: "Admin cannot delete their own account.",
    });
  }

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "User not found." });
  }

  res
    .status(200)
    .json({ success: true, message: "User deleted successfully." });
};

// ─── PUT /api/admin/users/:id/toggle-active ───────────────────────────────────
const toggleUserActive = async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: "Admin cannot deactivate their own account.",
    });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res
      .status(404)
      .json({ success: false, message: "User not found." });
  }

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? "activated" : "deactivated"} successfully.`,
    user: { _id: user._id, name: user.name, isActive: user.isActive },
  });
};

// ─── PUT /api/admin/issues/:id/assign ─────────────────────────────────────────
const assignIssue = async (req, res) => {
  const { assignedTo, department, priority } = req.body;

  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    return res
      .status(404)
      .json({ success: false, message: "Issue not found." });
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

  const updated = await Issue.findByIdAndUpdate(
    req.params.id,
    {
      ...(assignedTo !== undefined && { assignedTo }),
      ...(department !== undefined && { department }),
      ...(priority !== undefined && { priority }),
      status: "in_progress",
    },
    { new: true, runValidators: true }
  )
    .populate("reportedBy", "name email")
    .populate("assignedTo", "name email department");

  res.status(200).json({ success: true, issue: updated });
};

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
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
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  assignIssue,
  getAdminStats,
};
