const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

/**
 * ADMIN ROUTES
 * All routes require ADMIN role
 */

// Get all issues with filters (status, priority, category, verificationStatus)
router.get('/issues', authMiddleware, requireRole(['ADMIN']), adminController.getIssuesForAdmin);

// Get detailed issue information with activity log
router.get('/issues/:id', authMiddleware, requireRole(['ADMIN']), adminController.getIssueDetail);

// Approve issue (verification)
router.post('/approve', authMiddleware, requireRole(['ADMIN']), adminController.approveIssue);

// Reject issue
router.post('/reject', authMiddleware, requireRole(['ADMIN']), adminController.rejectIssue);

// Assign issue to department
router.post('/assign', authMiddleware, requireRole(['ADMIN']), adminController.assignDepartment);

// Get admin dashboard statistics
router.get('/stats', authMiddleware, requireRole(['ADMIN']), adminController.getAdminStats);

// Get all department users for assignment
router.get('/department-users', authMiddleware, requireRole(['ADMIN']), adminController.getDepartmentUsers);

module.exports = router;
