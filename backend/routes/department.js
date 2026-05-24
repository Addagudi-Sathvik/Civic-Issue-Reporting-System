const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

/**
 * DEPARTMENT ROUTES
 * All routes require DEPARTMENT role
 */

// Get issues assigned to this department
router.get('/issues', protect, authorize('department'), departmentController.getDepartmentIssues);

// Update issue status (ASSIGNED → IN_PROGRESS → RESOLVED)
router.patch('/issues/:id/status', protect, authorize('department'), departmentController.updateIssueStatus);

// Upload proof of completion
router.post('/issues/:id/proof', protect, authorize('department'), upload.array('proof', 5), departmentController.uploadProof);

// Get department dashboard statistics
router.get('/stats', protect, authorize('department'), departmentController.getDepartmentStats);

// Get activity log for department issues
router.get('/activity', protect, authorize('department'), departmentController.getDepartmentActivity);

module.exports = router;
