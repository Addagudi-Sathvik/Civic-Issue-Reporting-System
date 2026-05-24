const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

/**
 * ADMIN ROUTES
 * All routes require ADMIN role
 */

// Get all issues with filters (status, priority, category, verificationStatus)
router.get('/issues', protect, authorize('admin'), adminController.getIssuesForAdmin);

// Get detailed issue information with activity log
router.get('/issues/:id', protect, authorize('admin'), adminController.getIssueDetail);

// Approve issue (verification)
router.post('/approve', protect, authorize('admin'), adminController.approveIssue);

// Reject issue
router.post('/reject', protect, authorize('admin'), adminController.rejectIssue);

// Assign issue to department
router.post('/assign', protect, authorize('admin'), adminController.assignDepartment);

// Get admin dashboard statistics
router.get('/stats', protect, authorize('admin'), adminController.getAdminStats);

// Get all department users for assignment
router.get('/department-users', protect, authorize('admin'), adminController.getDepartmentUsers);

module.exports = router;
