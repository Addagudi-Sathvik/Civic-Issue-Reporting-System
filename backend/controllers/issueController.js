// backend/controllers/issueController.js
const Issue = require("../models/Issue");
const User = require("../models/User");
const fs = require("fs/promises");

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const parseGeminiJson = (text) => {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : cleaned);
};

// ─── GET /api/issues  ─────────────────────────────────────────────────────────
// Citizen: sees only their own issues
// Department: sees issues in their department
// Admin: sees all issues
const getIssues = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 100 } = req.query;

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

    if (status) filter.status = String(status).toLowerCase();
    if (category) filter.category = String(category).toLowerCase();
    if (priority) filter.priority = String(priority).toLowerCase();

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Issue.countDocuments(filter);

    const issues = await Issue.find(filter)
      .populate("reportedBy", "name email")
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
      message: "Failed to fetch issues.",
      error: error.message,
    });
  }
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

// ─── GET /api/issues/nearby ───────────────────────────────────────────────────
const getNearbyIssues = async (req, res) => {
  const latitude = req.query.latitude || req.query.lat || req.body.lat || req.body.latitude;
  const longitude = req.query.longitude || req.query.lng || req.body.lng || req.body.longitude;
  const radius = req.query.radius || req.query.radiusKm || req.body.radiusKm || req.body.radius || 5;
  const category = req.query.category || req.body.category;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: "Latitude and longitude are required.",
    });
  }

  try {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusDegrees = parseFloat(radius) / 111;

    const issues = await Issue.find({
      ...(category ? { category: String(category).toLowerCase() } : {}),
      "location.lat": { $gte: lat - radiusDegrees, $lte: lat + radiusDegrees },
      "location.lng": { $gte: lng - radiusDegrees, $lte: lng + radiusDegrees },
    }).populate('reportedBy', 'name email');

    console.log("Nearby issues fetched:", issues.length);
    res.status(200).json({ success: true, issues });
  } catch (error) {
    console.log("Backend fetch error:", error);
    res.status(400).json({
      success: false,
      message: "Error fetching nearby issues.",
      error: error.message,
    });
  }
};

// ─── POST /api/issues/:id/vote ────────────────────────────────────────────────
const voteIssue = async (req, res) => {
  const issue = await Issue.findById(req.params.id);

  if (!issue) {
    return res.status(404).json({
      success: false,
      message: "Issue not found.",
    });
  }

  // Check if user already voted
  const hasVoted = issue.votes && issue.votes.includes(req.user._id);
  if (hasVoted) {
    return res.status(400).json({
      success: false,
      message: "You have already voted for this issue.",
    });
  }

  // Add vote
  if (!issue.votes) issue.votes = [];
  issue.votes.push(req.user._id);
  await issue.save();

  res.status(200).json({
    success: true,
    message: "Vote recorded.",
    votes: issue.votes.length,
  });
};

// ─── POST /api/issues/validate ────────────────────────────────────────────────
const validateImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image provided.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        valid: false,
        message: "AI validation is not configured. Missing GEMINI_API_KEY.",
      });
    }

    const category = req.body.category || "civic issue";
    const imageBuffer = await fs.readFile(req.file.path);
    const imageBase64 = imageBuffer.toString("base64");

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Validate whether this image is evidence for a civic issue in the category "${category}". Return only JSON with keys: valid boolean, category string, confidence number from 0 to 1, objects_detected string array, message string.`,
                },
                {
                  inline_data: {
                    mime_type: req.file.mimetype,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      throw new Error(
        geminiData.error?.message ||
          `Gemini validation failed with status ${geminiResponse.status}`
      );
    }

    const responseText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const validation = parseGeminiJson(responseText);

    res.status(200).json({
      success: true,
      valid: Boolean(validation.valid),
      category: validation.category || category,
      confidence: Number(validation.confidence || 0),
      objects_detected: Array.isArray(validation.objects_detected)
        ? validation.objects_detected
        : [],
      message: validation.message || "Image validation completed.",
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
    });
  } catch (error) {
    console.log("Validation Backend Error:", error);
    res.status(500).json({
      success: false,
      valid: false,
      message: "Image validation failed.",
      error: error.message,
    });
  }
};

// ─── PATCH /api/issues/:id/approve ────────────────────────────────────────────
const approveIssue = async (req, res) => {
  const issue = await Issue.findById(req.params.id);

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

  const updated = await Issue.findById(issue._id)
    .populate("reportedBy", "name email")
    .populate("verifiedBy", "name email");

  res.status(200).json({ success: true, issue: updated });
};

// ─── PATCH /api/issues/:id/reject ────────────────────────────────────────────
const rejectIssue = async (req, res) => {
  const { reason } = req.body;

  const issue = await Issue.findById(req.params.id);

  if (!issue) {
    return res.status(404).json({
      success: false,
      message: "Issue not found.",
    });
  }

  issue.status = "rejected";
  issue.rejectionReason = reason || "";
  issue.rejectedAt = new Date();
  issue.rejectedBy = req.user._id;

  await issue.save();

  const updated = await Issue.findById(issue._id)
    .populate("reportedBy", "name email")
    .populate("rejectedBy", "name email");

  res.status(200).json({ success: true, issue: updated });
};

// ─── PATCH /api/issues/:id/assign ────────────────────────────────────────────
const assignDepartment = async (req, res) => {
  const { assignedTo, department, priority } = req.body;

  const issue = await Issue.findById(req.params.id);

  if (!issue) {
    return res.status(404).json({
      success: false,
      message: "Issue not found.",
    });
  }

  if (assignedTo) {
    const assignee = await require("../models/User").findById(assignedTo);
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

  const updated = await Issue.findById(issue._id)
    .populate("reportedBy", "name email")
    .populate("assignedTo", "name email department");

  res.status(200).json({ success: true, issue: updated });
};

// ─── PATCH /api/issues/:id/status ────────────────────────────────────────────
const updateDepartmentStatus = async (req, res) => {
  const { adminNote } = req.body;
  const status = req.body.status?.toLowerCase();

  const allowedStatuses = ["pending", "in_progress", "resolved", "rejected"];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
    });
  }

  const issue = await Issue.findById(req.params.id);

  if (!issue) {
    return res.status(404).json({
      success: false,
      message: "Issue not found.",
    });
  }

  // Department users can only update their own department's issues
  if (
    req.user.role === "department" &&
    issue.department !== req.user.department
  ) {
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

// ─── GET /api/issues/filter/status ────────────────────────────────────────────
const getIssuesByStatus = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status filter is required.",
    });
  }

  const validStatuses = ["pending", "verified", "assigned", "in_progress", "resolved", "rejected"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
    });
  }

  let filter = { status };

  if (req.user.role === "citizen") {
    filter.reportedBy = req.user._id;
  } else if (req.user.role === "department") {
    filter.department = req.user.department;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Issue.countDocuments(filter);

  const issues = await Issue.find(filter)
    .populate("reportedBy", "name email")
    .populate("assignedTo", "name email")
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

// ─── GET /api/issues/:id/logs ─────────────────────────────────────────────────
const getIssueActivityLogs = async (req, res) => {
  const ActivityLog = require("../models/ActivityLog");

  const logs = await ActivityLog.find({ issueId: req.params.id })
    .populate("performedBy", "name email role")
    .sort({ createdAt: -1 });

  if (!logs) {
    return res.status(200).json({ success: true, logs: [] });
  }

  res.status(200).json({ success: true, logs });
};

module.exports = {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  addComment,
  getStats,
  getNearbyIssues,
  voteIssue,
  validateImage,
  approveIssue,
  rejectIssue,
  assignDepartment,
  updateDepartmentStatus,
  getIssuesByStatus,
  getIssueActivityLogs,
};
