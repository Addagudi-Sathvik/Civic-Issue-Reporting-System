const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { protect, admin, department } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// User Routes
router.post('/', protect, upload.array('media', 5), issueController.createIssue);
router.get('/', issueController.getIssues);
router.get('/nearby', issueController.getNearbyIssues);
router.get('/:id', issueController.getIssueById);
router.post('/:id/vote', protect, issueController.voteIssue);
router.post('/validate', protect, upload.single('image'), issueController.validateImage);

// Admin & Department Management
router.patch('/:id/approve', protect, admin, issueController.approveIssue);
router.patch('/:id/reject', protect, admin, issueController.rejectIssue);
router.patch('/:id/assign', protect, admin, issueController.assignDepartment);
router.patch('/:id/status', protect, department, issueController.updateDepartmentStatus);

// Filtering
router.get('/filter/status', protect, issueController.getIssuesByStatus);
router.get('/:id/logs', protect, issueController.getIssueActivityLogs);

module.exports = router;
