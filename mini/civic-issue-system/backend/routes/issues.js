const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

const upload = require('../middlewares/upload');

// New simulated AI validation route
router.post('/validate-image', authMiddleware, upload.single('media'), issueController.validateImage);

// New nearby issues route
router.post('/nearby', authMiddleware, issueController.getNearbyIssues);

// Public or basic auth routes
router.get('/', issueController.getIssues);
router.get('/:id', issueController.getIssueById);

// Create issue (User only or anyone logged in)
router.post('/', authMiddleware, upload.array('media', 5), issueController.createIssue);

// Update status (Admin or Department)
router.put('/:id/status', authMiddleware, requireRole(['ADMIN', 'DEPARTMENT']), issueController.updateIssueStatus);

// Workflow endpoints
router.post('/:id/approve', authMiddleware, requireRole(['ADMIN']), issueController.approveIssue);
router.post('/:id/reject', authMiddleware, requireRole(['ADMIN']), issueController.rejectIssue);
router.post('/:id/assign-department', authMiddleware, requireRole(['ADMIN']), issueController.assignDepartment);
router.put('/:id/department-status', authMiddleware, requireRole(['DEPARTMENT']), issueController.updateDepartmentStatus);

// Get issues by status (filtered by role)
router.get('/status', authMiddleware, issueController.getIssuesByStatus);

// Get department users
router.get('/departments/users', authMiddleware, requireRole(['ADMIN']), issueController.getDepartmentUsers);

// Get activity logs for an issue
router.get('/:id/activity', authMiddleware, issueController.getIssueActivityLogs);

// Vote / Repost an issue
router.post('/:id/vote', authMiddleware, issueController.voteIssue);

module.exports = router;
