const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authMiddleware, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

/**
 * DEPARTMENT ROUTES
 * All routes require DEPARTMENT role
 */

// Get issues assigned to this department
router.get('/issues', authMiddleware, requireRole(['DEPARTMENT']), departmentController.getDepartmentIssues);

// Update issue status (ASSIGNED → IN_PROGRESS → RESOLVED)
router.patch('/issues/:id/status', authMiddleware, requireRole(['DEPARTMENT']), departmentController.updateIssueStatus);

// Upload proof of completion
router.post('/issues/:id/proof', authMiddleware, requireRole(['DEPARTMENT']), upload.array('proof', 5), departmentController.uploadProof);

// Get department dashboard statistics
router.get('/stats', authMiddleware, requireRole(['DEPARTMENT']), departmentController.getDepartmentStats);

// Get activity log for department issues
router.get('/activity', authMiddleware, requireRole(['DEPARTMENT']), departmentController.getDepartmentActivity);

module.exports = router;
