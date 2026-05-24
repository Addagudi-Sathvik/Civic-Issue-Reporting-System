const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');

const { protect, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// User Routes
router.post(
  '/',
  protect,
  upload.array('media', 5),
  issueController.createIssue
);

router.get('/', protect, issueController.getIssues);

router.get('/nearby', issueController.getNearbyIssues);
router.post('/nearby', issueController.getNearbyIssues);

router.get('/:id', protect, issueController.getIssueById);

router.post(
  '/:id/vote',
  protect,
  issueController.voteIssue
);

router.post(
  '/validate',
  protect,
  upload.single('image'),
  issueController.validateImage
);

// Admin & Department Management
router.patch(
  '/:id/approve',
  protect,
  authorize('admin'),
  issueController.approveIssue
);

router.patch(
  '/:id/reject',
  protect,
  authorize('admin'),
  issueController.rejectIssue
);

router.patch(
  '/:id/assign',
  protect,
  authorize('admin'),
  issueController.assignDepartment
);

router.patch(
  '/:id/status',
  protect,
  authorize('admin', 'department'),
  issueController.updateDepartmentStatus
);

router.put(
  '/:id/status',
  protect,
  authorize('admin', 'department'),
  issueController.updateDepartmentStatus
);

// Filtering & Logs
router.get(
  '/filter/status',
  protect,
  issueController.getIssuesByStatus
);

router.get(
  '/:id/logs',
  protect,
  issueController.getIssueActivityLogs
);

module.exports = router;
