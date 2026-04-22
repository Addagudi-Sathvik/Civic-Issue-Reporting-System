const Issue = require('../models/Issue');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Confirmation = require('../models/Confirmation');
const { sendNotification } = require('../services/notificationService');

/**
 * GET /api/admin/issues
 * Fetch all issues with optional filters (status, priority, category, verificationStatus)
 */
exports.getIssuesForAdmin = async (req, res) => {
  try {
    const { status, priority, category, verificationStatus, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    const issues = await Issue.find(filter)
      .populate('reporterId', 'name email trustScore')
      .populate('assignedDepartmentId', 'name departmentType')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Issue.countDocuments(filter);

    res.json({
      issues,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/admin/issues/:id
 * Get detailed issue information
 */
exports.getIssueDetail = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reporterId', 'name email trustScore reportsCount falseReportsCount')
      .populate('assignedDepartmentId', 'name departmentType')
      .populate('voters', 'name email');
      
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // Get activity log
    const activityLog = await ActivityLog.find({ issueId: issue._id })
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 });

    // Get confirmation details
    const confirmations = await Confirmation.find({ issueId: issue._id })
      .populate('userId', 'name email');

    res.json({ issue, activityLog, confirmations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * POST /api/admin/approve
 * Admin approves an issue (verification)
 */
exports.approveIssue = async (req, res) => {
  try {
    const { issueId, remarks } = req.body;
    const adminId = req.user.userId;

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // Update issue
    issue.verificationStatus = 'APPROVED';
    issue.status = 'VERIFIED';
    issue.verificationType = 'ADMIN';
    issue.adminRemarks = remarks;
    issue.verifiedAt = new Date();

    await issue.save();

    // Log activity
    await ActivityLog.create({
      issueId: issue._id,
      action: 'ADMIN_APPROVED',
      performedBy: adminId,
      remarks: remarks,
      newStatus: 'VERIFIED',
      metadata: { verificationType: 'ADMIN' }
    });

    // Award reporter points
    await User.findByIdAndUpdate(issue.reporterId, { $inc: { points: 20 } });

    // Send notification
    const reporter = await User.findById(issue.reporterId);
    await sendNotification('ISSUE_APPROVED', {
      email: reporter.email,
      title: issue.title,
      department: issue.assignedDepartment || 'To Be Assigned'
    });

    res.json({ message: 'Issue approved', issue });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * POST /api/admin/reject
 * Admin rejects an issue
 */
exports.rejectIssue = async (req, res) => {
  try {
    const { issueId, rejectionReason } = req.body;
    const adminId = req.user.userId;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // Update issue
    issue.verificationStatus = 'REJECTED';
    issue.status = 'REJECTED';
    issue.rejectionReason = rejectionReason;

    await issue.save();

    // Log activity
    await ActivityLog.create({
      issueId: issue._id,
      action: 'ADMIN_REJECTED',
      performedBy: adminId,
      remarks: rejectionReason,
      newStatus: 'REJECTED'
    });

    // Decrease reporter trustScore
    await User.findByIdAndUpdate(issue.reporterId, { $inc: { trustScore: -5, falseReportsCount: 1 } });

    // Send notification
    const reporter = await User.findById(issue.reporterId);
    await sendNotification('ISSUE_REJECTED', {
      email: reporter.email,
      title: issue.title,
      reason: rejectionReason
    });

    res.json({ message: 'Issue rejected', issue });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * POST /api/admin/assign
 * Admin assigns verified issue to department
 */
exports.assignDepartment = async (req, res) => {
  try {
    const { issueId, departmentUserId } = req.body;
    const adminId = req.user.userId;

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    if (issue.status !== 'VERIFIED') {
      return res.status(400).json({ message: 'Only verified issues can be assigned' });
    }

    // Get department user
    const departmentUser = await User.findById(departmentUserId);
    if (!departmentUser || !['DEPARTMENT', 'ADMIN'].includes(departmentUser.role)) {
      return res.status(400).json({ message: 'Invalid department user' });
    }

    // Update issue
    issue.assignedDepartmentId = departmentUserId;
    issue.assignedDepartment = departmentUser.departmentType;
    issue.status = 'ASSIGNED';
    issue.assignedAt = new Date();

    await issue.save();

    // Log activity
    await ActivityLog.create({
      issueId: issue._id,
      action: 'DEPARTMENT_ASSIGNED',
      performedBy: adminId,
      remarks: `Assigned to ${departmentUser.name} (${departmentUser.departmentType})`,
      newStatus: 'ASSIGNED',
      metadata: { assignedTo: departmentUserId, departmentType: departmentUser.departmentType }
    });

    // Send notifications
    const reporter = await User.findById(issue.reporterId);
    await sendNotification('ISSUE_ASSIGNED', {
      email: reporter.email,
      title: issue.title,
      department: issue.assignedDepartment,
      departmentEmail: departmentUser.email
    });

    res.json({ message: 'Issue assigned to department', issue });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/admin/stats
 * Dashboard statistics for admin
 */
exports.getAdminStats = async (req, res) => {
  try {
    const stats = {
      totalIssues: await Issue.countDocuments(),
      pendingVerification: await Issue.countDocuments({ status: 'PENDING_VERIFICATION' }),
      verified: await Issue.countDocuments({ status: 'VERIFIED' }),
      assigned: await Issue.countDocuments({ status: 'ASSIGNED' }),
      inProgress: await Issue.countDocuments({ status: 'IN_PROGRESS' }),
      resolved: await Issue.countDocuments({ status: 'RESOLVED' }),
      rejected: await Issue.countDocuments({ status: 'REJECTED' }),
      
      // Priority distribution
      highPriority: await Issue.countDocuments({ priority: 'HIGH' }),
      mediumPriority: await Issue.countDocuments({ priority: 'MEDIUM' }),
      lowPriority: await Issue.countDocuments({ priority: 'LOW' }),
      
      // Recent activity
      recentActivity: await ActivityLog.find()
        .populate('performedBy', 'name email')
        .populate('issueId', 'title category')
        .sort({ createdAt: -1 })
        .limit(10)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/admin/department-users
 * Get all department users for assignment
 */
exports.getDepartmentUsers = async (req, res) => {
  try {
    const departments = await User.find({ role: 'DEPARTMENT' })
      .select('name email departmentType');

    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
