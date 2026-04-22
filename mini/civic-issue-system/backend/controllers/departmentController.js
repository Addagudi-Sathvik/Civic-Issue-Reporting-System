const Issue = require('../models/Issue');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { sendNotification } = require('../services/notificationService');

/**
 * GET /api/department/issues
 * Get issues assigned to the department with filters
 */
exports.getDepartmentIssues = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const departmentUser = await User.findById(req.user.userId);

    if (!departmentUser || departmentUser.role !== 'DEPARTMENT') {
      return res.status(403).json({ message: 'Unauthorized - DEPARTMENT role required' });
    }

    const filter = {
      assignedDepartmentId: req.user.userId,
      status: { $in: ['ASSIGNED', 'IN_PROGRESS'] }
    };

    if (status) filter.status = status;

    const issues = await Issue.find(filter)
      .populate('reporterId', 'name email phone')
      .sort({ priority: -1, createdAt: -1 })
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
 * PATCH /api/department/issues/:id/status
 * Update issue status (ASSIGNED → IN_PROGRESS → RESOLVED)
 */
exports.updateIssueStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const departmentUserId = req.user.userId;
    const issueId = req.params.id;

    // Validate status
    const validStatuses = ['IN_PROGRESS', 'RESOLVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be IN_PROGRESS or RESOLVED' });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // Verify department access
    if (issue.assignedDepartmentId.toString() !== departmentUserId) {
      return res.status(403).json({ message: 'Unauthorized - Issue not assigned to your department' });
    }

    const oldStatus = issue.status;

    // Update issue
    issue.status = status;
    if (status === 'IN_PROGRESS') {
      issue.inProgressAt = new Date();
    } else if (status === 'RESOLVED') {
      issue.resolvedAt = new Date();
    }

    // Add remark to department remarks
    if (remarks) {
      issue.departmentRemarks.push({
        message: remarks,
        timestamp: new Date(),
        userId: departmentUserId,
        userRole: 'DEPARTMENT'
      });
    }

    await issue.save();

    // Log activity
    await ActivityLog.create({
      issueId: issue._id,
      action: 'STATUS_UPDATED',
      performedBy: departmentUserId,
      oldStatus: oldStatus,
      newStatus: status,
      remarks: remarks || `Status changed to ${status}`,
      metadata: { userRole: 'DEPARTMENT' }
    });

    // Award department points for status update
    await User.findByIdAndUpdate(departmentUserId, { $inc: { points: 15 } });

    // Send notification to reporter
    const reporter = await User.findById(issue.reporterId);
    if (status === 'RESOLVED') {
      // Award reporter resolution bonus
      await User.findByIdAndUpdate(issue.reporterId, { $inc: { points: 30, trustScore: 5 } });

      await sendNotification('ISSUE_RESOLVED', {
        email: reporter.email,
        title: issue.title,
        remarks: remarks || 'Your reported issue has been resolved.'
      });
    } else {
      await sendNotification('ISSUE_IN_PROGRESS', {
        email: reporter.email,
        title: issue.title,
        department: issue.assignedDepartment
      });
    }

    res.json({ message: `Issue status updated to ${status}`, issue });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * POST /api/department/issues/:id/proof
 * Upload proof of completion for resolved issue
 */
exports.uploadProof = async (req, res) => {
  try {
    const issueId = req.params.id;
    const departmentUserId = req.user.userId;

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // Verify department access
    if (issue.assignedDepartmentId.toString() !== departmentUserId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (issue.status !== 'RESOLVED') {
      return res.status(400).json({ message: 'Can only upload proof for resolved issues' });
    }

    // Add uploaded files to proofOfCompletion
    if (req.files && req.files.length > 0) {
      const proofUrls = req.files.map(file => `/uploads/${file.filename}`);
      issue.proofOfCompletion.push(...proofUrls);
      await issue.save();
    }

    res.json({ message: 'Proof uploaded successfully', issue });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/department/stats
 * Dashboard statistics for department
 */
exports.getDepartmentStats = async (req, res) => {
  try {
    const departmentUserId = req.user.userId;

    const stats = {
      assigned: await Issue.countDocuments({
        assignedDepartmentId: departmentUserId,
        status: 'ASSIGNED'
      }),
      inProgress: await Issue.countDocuments({
        assignedDepartmentId: departmentUserId,
        status: 'IN_PROGRESS'
      }),
      resolved: await Issue.countDocuments({
        assignedDepartmentId: departmentUserId,
        status: 'RESOLVED'
      }),
      
      // By priority
      highPriority: await Issue.countDocuments({
        assignedDepartmentId: departmentUserId,
        priority: 'HIGH',
        status: { $in: ['ASSIGNED', 'IN_PROGRESS'] }
      }),
      
      // Recent activity
      recentIssues: await Issue.find({
        assignedDepartmentId: departmentUserId
      })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title priority status updatedAt')
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/department/activity
 * Get activity log for department issues
 */
exports.getDepartmentActivity = async (req, res) => {
  try {
    const departmentUserId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    // Get all issues for this department
    const issues = await Issue.find({ assignedDepartmentId: departmentUserId }).select('_id');
    const issueIds = issues.map(i => i._id);

    const activities = await ActivityLog.find({ issueId: { $in: issueIds } })
      .populate('performedBy', 'name email role')
      .populate('issueId', 'title status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments({ issueId: { $in: issueIds } });

    res.json({
      activities,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
