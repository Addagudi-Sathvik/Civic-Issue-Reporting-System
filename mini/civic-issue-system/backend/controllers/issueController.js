const Issue = require('../models/Issue');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { sendNotification } = require('../services/notificationService');

function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; 
  var dLat = deg2rad(lat2-lat1); 
  var dLon = deg2rad(lon2-lon1); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}
function deg2rad(deg) { return deg * (Math.PI/180) }

function calculatePriority(votes) {
  if (votes >= 20) return 'HIGH';
  if (votes >= 5) return 'MEDIUM';
  return 'LOW';
}

exports.createIssue = async (req, res) => {
  try {
    let { title, description, category, location } = req.body;
    
    if (typeof location === 'string') {
      try {
        location = JSON.parse(location);
      } catch (err) {
        console.error("Error parsing location:", err);
      }
    }

    let media = [];
    if (req.files && req.files.length > 0) {
      media = req.files.map(file => `/uploads/${file.filename}`);
    } else if (req.body.media) {
      media = Array.isArray(req.body.media) ? req.body.media : [req.body.media];
    }

    const issue = new Issue({
      title,
      description,
      category,
      location,
      media,
      reporterId: req.user.userId,
      status: 'PENDING_VERIFICATION',
      verificationStatus: 'PENDING',
    });

    await issue.save();
    
    // Award Gamification Points for new issue: +10 base, +50 bonus = 60
    await User.findByIdAndUpdate(req.user.userId, { $inc: { points: 60 } });

    res.status(201).json(issue);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getIssues = async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate('reporterId', 'name email')
      .populate('assignedDepartmentId', 'name departmentType')
      .sort({ createdAt: -1 });
    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reporterId', 'name email')
      .populate('assignedDepartmentId', 'name departmentType');
      
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateIssueStatus = async (req, res) => {
  try {
    const { status, assignedDepartmentId, priority, proofOfCompletion } = req.body;
    const updateData = { status };
    if (assignedDepartmentId) updateData.assignedDepartmentId = assignedDepartmentId;
    if (priority) updateData.priority = priority;
    if (proofOfCompletion) updateData.proofOfCompletion = proofOfCompletion;
    if (status === 'RESOLVED') updateData.resolvedAt = new Date();

    const issue = await Issue.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// [NEW] Real AI Validation Endpoint integrating Google Gemini
exports.validateImage = async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({
        valid: false,
        category: null,
        confidence: 0,
        objects_detected: [],
        message: "Category is required",
      });
    }

    // Fallback (if Gemini key missing)
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        valid: true,
        category: category,
        confidence: 80,
        objects_detected: [],
        message: "Simulated validation (no AI key)",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        valid: false,
        category: null,
        confidence: 0,
        objects_detected: [],
        message: "No image uploaded",
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Analyze this image and return ONLY JSON:
{
  "category": "ROADS|GARBAGE|ELECTRICITY|WATER|OTHER",
  "confidence": number,
  "objects_detected": ["object1", "object2"]
}
`;

    const imageParts = [
      fileToGenerativePart(req.file.path, req.file.mimetype),
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    let responseText = result.response.text().trim();

    // Clean markdown if present
    if (responseText.includes("```")) {
      responseText = responseText.replace(/```json/gi, "").replace(/```/gi, "").trim();
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response");

    const aiData = JSON.parse(jsonMatch[0]);

    // Normalize
    const normalize = (text) => text.toLowerCase().trim();

    let mappedCategory = (aiData.category || "OTHER").toUpperCase();

    if (mappedCategory.includes("ROAD")) mappedCategory = "ROADS";
    else if (mappedCategory.includes("GARBAGE") || mappedCategory.includes("TRASH")) mappedCategory = "GARBAGE";
    else if (mappedCategory.includes("ELECTR")) mappedCategory = "ELECTRICITY";
    else if (mappedCategory.includes("WATER") || mappedCategory.includes("FLOOD")) mappedCategory = "WATER";
    else mappedCategory = "OTHER";

    const confidence = Number(aiData.confidence) || 0;
    const objects = aiData.objects_detected || [];

    // Keyword matching
    const categoryKeywords = {
      ROADS: ["road", "pothole", "crack", "damage"],
      GARBAGE: ["garbage", "trash", "waste", "plastic", "litter"],
      WATER: ["water", "leak", "pipe", "flood"],
      ELECTRICITY: ["electric", "wire", "pole", "light"],
    };

    const userCategory = category.toUpperCase();
    const keywords = categoryKeywords[userCategory] || [];

    const keywordMatch = objects.some(obj =>
      keywords.some(keyword =>
        normalize(obj).includes(keyword)
      )
    );

    // Final decision (flexible)
    let isValid = false;

    if (mappedCategory === userCategory) {
      isValid = confidence >= 40;
    } else if (keywordMatch) {
      isValid = confidence >= 35;
    } else if (mappedCategory === "OTHER") {
      isValid = confidence >= 30;
    }

    if (!isValid) {
      return res.status(200).json({
        valid: false,
        category: mappedCategory,
        confidence,
        objects_detected: objects,
        message: "❌ Image does not clearly match category",
      });
    }

    return res.status(200).json({
      valid: true,
      category: mappedCategory,
      confidence,
      objects_detected: objects,
      message: `✅ Image verified (${confidence}% confidence)`,
    });

  } catch (error) {
    console.error("Validation error:", error);

    return res.status(500).json({
      valid: false,
      category: null,
      confidence: 0,
      objects_detected: [],
      message: "Server error during validation",
    });
  }
};    // Clean up Markdown formatting
    if (responseText.includes('```')) {
       responseText = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    }

    // Extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
       return res.status(400).json({ 
         valid: false,
         category: null,
         confidence: 0,
         objects_detected: [],
         message: 'AI validation failed - invalid response format' 
       });
    }

    let aiData;
    try {
      aiData = JSON.parse(jsonMatch[0]);
    } catch (e) {
      return res.status(400).json({ 
        valid: false,
        category: null,
        confidence: 0,
        objects_detected: [],
        message: 'Failed to parse AI response' 
      });
    }

    let mappedCategory = aiData.category?.toString().trim().toUpperCase() || 'OTHER';
    const validCategories = ['ROADS', 'GARBAGE', 'ELECTRICITY', 'WATER', 'OTHER'];
    
    // Normalize category
    if (mappedCategory.includes('ROAD')) mappedCategory = 'ROADS';
    else if (mappedCategory.includes('GARBAGE') || mappedCategory.includes('TRASH')) mappedCategory = 'GARBAGE';
    else if (mappedCategory.includes('ELECTR') || mappedCategory.includes('LIGHT')) mappedCategory = 'ELECTRICITY';
    else if (mappedCategory.includes('WATER') || mappedCategory.includes('FLOOD')) mappedCategory = 'WATER';
    else if (!validCategories.includes(mappedCategory)) {
        mappedCategory = 'OTHER';
    }

    const confidence = Number(aiData.confidence) || 0;
    const isMismatch = mappedCategory !== category;
    
    // STRICT validation: confidence must be >= 70 AND category must match (unless OTHER)
    if (isMismatch && mappedCategory !== 'OTHER' && category !== 'OTHER') {
      return res.status(400).json({
        valid: false,
        category: mappedCategory,
        confidence: confidence,
        objects_detected: aiData.objects_detected || [],
        message: `❌ Image does not match selected category. You selected: ${category}, AI detected: ${mappedCategory}. Please upload a ${category.toLowerCase()} image.`
      });
    }

    if (confidence < 70) {
      return res.status(400).json({
        valid: false,
        category: mappedCategory,
        confidence: confidence,
        objects_detected: aiData.objects_detected || [],
        message: `❌ Image clarity too low (${confidence}% confidence). Please upload a clearer, well-lit image.`
      });
    }

    res.status(200).json({ 
      valid: true,
      category: mappedCategory,
      confidence: confidence,
      objects_detected: aiData.objects_detected || [],
      message: `✅ Image verified! (${confidence}% confidence)` 
    });
  } catch (error) {
    console.error("AI Validation Error:", error);
    res.status(500).json({ 
      valid: false,
      category: null,
      confidence: 0,
      objects_detected: [],
      message: 'Server error during validation. Please try again.' 
    });
  }
};

// [NEW] Get Nearby Issues
exports.getNearbyIssues = async (req, res) => {
  try {
    const { lat, lng, category, radiusKm = 3 } = req.body;
    if (!lat || !lng) return res.status(400).json({ message: 'lat and lng required' });

    let query = {};
    if (category) {
      query.category = category;
    }

    const allIssues = await Issue.find(query).select('title description location status votes priority category createdAt media');
    
    // Filter issues mathematically within strict radius
    const nearby = allIssues.filter(issue => {
      if (!issue.location || !issue.location.lat || !issue.location.lng) return false;
      const d = getDistanceFromLatLonInKm(lat, lng, issue.location.lat, issue.location.lng);
      return d <= radiusKm;
    });

    res.json(nearby);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// [NEW] Vote / Repost Issue
exports.voteIssue = async (req, res) => {
  try {
    const issueId = req.params.id;
    const userId = req.user.userId;

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    if (issue.voters && issue.voters.includes(userId)) {
      return res.status(400).json({ message: 'You have already voted for this issue' });
    }

    issue.votes = (issue.votes || 0) + 1;
    issue.voters.push(userId);
    issue.priority = calculatePriority(issue.votes);

    await issue.save();

    // Log activity
    await ActivityLog.create({
      issueId: issue._id,
      action: 'VOTE_ADDED',
      performedBy: userId,
      remarks: `Vote added, new total: ${issue.votes}`,
      metadata: { newVoteCount: issue.votes, newPriority: issue.priority }
    });

    // Reward gamification points for reposting
    await User.findByIdAndUpdate(userId, { $inc: { points: 5 } });

    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ===== WORKFLOW MANAGEMENT ENDPOINTS =====

// Admin: Approve/Verify issue
exports.approveIssue = async (req, res) => {
  try {
    const { adminRemarks } = req.body;
    const issueId = req.params.id;

    const issue = await Issue.findById(issueId).populate('reporterId', 'name email');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    if (issue.verificationStatus !== 'PENDING') {
      return res.status(400).json({ message: 'Issue has already been processed' });
    }

    // Auto-assign department based on category
    const departmentMapping = {
      'ROADS': 'ROADS',
      'WATER': 'WATER',
      'GARBAGE': 'GARBAGE',
      'ELECTRICITY': 'ELECTRICITY',
      'OTHER': 'OTHER'
    };

    const assignedDepartment = departmentMapping[issue.category] || 'OTHER';

    // Find available department user for this category
    const departmentUser = await User.findOne({
      role: 'DEPARTMENT',
      departmentType: assignedDepartment
    });

    issue.verificationStatus = 'APPROVED';
    issue.status = 'VERIFIED';
    issue.adminRemarks = adminRemarks;
    issue.assignedDepartment = assignedDepartment;
    issue.assignedDepartmentId = departmentUser ? departmentUser._id : null;
    issue.verifiedAt = new Date();

    await issue.save();

    // Log activity
    await ActivityLog.create({
      issueId: issue._id,
      action: 'ADMIN_APPROVED',
      performedBy: req.user.userId,
      oldStatus: 'PENDING_VERIFICATION',
      newStatus: 'VERIFIED',
      remarks: adminRemarks,
      metadata: { assignedDepartment, departmentUserId: departmentUser?._id }
    });

    // Send notification to user
    await sendNotification(issue.reporterId.email, 'ISSUE_APPROVED', {
      issueId: issue._id,
      title: issue.title,
      department: assignedDepartment
    });

    res.json({
      message: 'Issue approved and assigned to department',
      issue,
      assignedDepartment
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: Reject issue
exports.rejectIssue = async (req, res) => {
  try {
    const { rejectionReason, adminRemarks } = req.body;
    const issueId = req.params.id;

    const issue = await Issue.findById(issueId).populate('reporterId', 'name email');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    if (issue.verificationStatus !== 'PENDING') {
      return res.status(400).json({ message: 'Issue has already been processed' });
    }

    issue.verificationStatus = 'REJECTED';
    issue.status = 'REJECTED';
    issue.rejectionReason = rejectionReason;
    issue.adminRemarks = adminRemarks;

    await issue.save();

    // Log activity
    await ActivityLog.create({
      issueId: issue._id,
      action: 'ADMIN_REJECTED',
      performedBy: req.user.userId,
      oldStatus: 'PENDING_VERIFICATION',
      newStatus: 'REJECTED',
      remarks: adminRemarks,
      metadata: { rejectionReason }
    });

    // Send notification to user
    await sendNotification(issue.reporterId.email, 'ISSUE_REJECTED', {
      issueId: issue._id,
      title: issue.title,
      reason: rejectionReason
    });

    res.json({ message: 'Issue rejected', issue });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: Manually assign department
exports.assignDepartment = async (req, res) => {
  try {
    const { departmentType, departmentUserId } = req.body;
    const issueId = req.params.id;

    const issue = await Issue.findById(issueId).populate('reporterId', 'name email');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    if (issue.status !== 'VERIFIED') {
      return res.status(400).json({ message: 'Issue must be verified before assignment' });
    }

    issue.assignedDepartment = departmentType;
    issue.assignedDepartmentId = departmentUserId;
    issue.status = 'ASSIGNED';
    issue.assignedAt = new Date();

    await issue.save();

    // Log activity
    await ActivityLog.create({
      issueId: issue._id,
      action: 'DEPARTMENT_ASSIGNED',
      performedBy: req.user.userId,
      oldStatus: 'VERIFIED',
      newStatus: 'ASSIGNED',
      remarks: `Manually assigned to ${departmentType} department`,
      metadata: { departmentType, departmentUserId }
    });

    // Send notification to user
    await sendNotification(issue.reporterId.email, 'ISSUE_ASSIGNED', {
      issueId: issue._id,
      title: issue.title,
      department: departmentType
    });

    res.json({ message: 'Department assigned successfully', issue });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Department: Update issue status
exports.updateDepartmentStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const issueId = req.params.id;
    const userId = req.user.userId;

    const issue = await Issue.findById(issueId).populate('reporterId', 'name email');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // Check if user is assigned to this department
    if (issue.assignedDepartmentId.toString() !== userId) {
      return res.status(403).json({ message: 'You are not assigned to this issue' });
    }

    const validStatuses = ['IN_PROGRESS', 'RESOLVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status for department update' });
    }

    issue.status = status;

    // Add department remark
    if (remarks) {
      issue.departmentRemarks.push({
        message: remarks,
        userId: userId,
        userRole: 'DEPARTMENT'
      });
    }

    // Set timestamps
    if (status === 'IN_PROGRESS') {
      issue.inProgressAt = new Date();
    } else if (status === 'RESOLVED') {
      issue.resolvedAt = new Date();
    }

    await issue.save();

    // Log activity
    await ActivityLog.create({
      issueId: issue._id,
      action: 'STATUS_UPDATED',
      performedBy: userId,
      oldStatus: issue.status,
      newStatus: status,
      remarks: remarks,
      metadata: { departmentUpdate: true }
    });

    // Send notification to user
    const notificationType = status === 'IN_PROGRESS' ? 'ISSUE_IN_PROGRESS' : 'ISSUE_RESOLVED';
    await sendNotification(issue.reporterId.email, notificationType, {
      issueId: issue._id,
      title: issue.title,
      status: status
    });

    res.json({ message: `Issue status updated to ${status}`, issue });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get issues by status for admin/department dashboards
exports.getIssuesByStatus = async (req, res) => {
  try {
    const { status, department } = req.query;
    const userRole = req.user.role;
    const userId = req.user.userId;

    let query = {};

    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }

    // Filter based on user role
    if (userRole === 'ADMIN') {
      // Admin can see all issues
    } else if (userRole === 'DEPARTMENT') {
      // Department users can only see issues assigned to them
      query.assignedDepartmentId = userId;
    } else {
      // Regular users can only see their own issues
      query.reporterId = userId;
    }

    if (department) {
      query.assignedDepartment = department;
    }

    const issues = await Issue.find(query)
      .populate('reporterId', 'name email')
      .populate('assignedDepartmentId', 'name departmentType')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get department users for assignment
exports.getDepartmentUsers = async (req, res) => {
  try {
    const { departmentType } = req.query;

    let query = { role: 'DEPARTMENT' };
    if (departmentType) {
      query.departmentType = departmentType;
    }

    const departmentUsers = await User.find(query, 'name email departmentType');
    res.json(departmentUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get activity logs for an issue
exports.getIssueActivityLogs = async (req, res) => {
  try {
    const issueId = req.params.id;

    const logs = await ActivityLog.find({ issueId })
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
