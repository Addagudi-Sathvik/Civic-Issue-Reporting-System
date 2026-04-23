// backend/controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
const register = async (req, res) => {
  const { name, email, password, role, department, phone } = req.body;

  // Prevent anyone self-registering as admin
  // BUG FIX: original code allowed any role including admin
  const allowedSelfRoles = ["citizen", "department"];
  const userRole = allowedSelfRoles.includes(role) ? role : "citizen";

  // Department role requires a valid department
  if (userRole === "department" && !department) {
    return res.status(400).json({
      success: false,
      message: "Department field is required for department users.",
    });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res
      .status(400)
      .json({ success: false, message: "Email already registered." });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: userRole,
    department: userRole === "department" ? department : null,
    phone,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required." });
  }

  // BUG FIX: must use .select("+password") since password is select:false
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password." });
  }

  if (!user.isActive) {
    return res
      .status(403)
      .json({ success: false, message: "Account deactivated. Contact admin." });
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  // req.user is already set by protect middleware
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

// ─── PUT /api/auth/update-profile ─────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, user });
};

// ─── PUT /api/auth/change-password ────────────────────────────────────────────
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.matchPassword(currentPassword))) {
    return res
      .status(400)
      .json({ success: false, message: "Current password is incorrect." });
  }

  user.password = newPassword;
  await user.save();

  res
    .status(200)
    .json({ success: true, message: "Password changed successfully." });
};

module.exports = { register, login, getMe, updateProfile, changePassword };
