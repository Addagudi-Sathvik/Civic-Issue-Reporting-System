const express = require('express');
const router = express.Router();
const confirmationController = require('../controllers/confirmationController');
const { protect } = require('../middlewares/auth');

// Add confirmation to an issue
router.post('/:id/confirm', protect, confirmationController.addConfirmation);

// Get confirmations for an issue
router.get('/:id/confirmations', protect, confirmationController.getIssueConfirmations);

// Get user's confirmations
router.get('/user/confirmations', protect, confirmationController.getUserConfirmations);

module.exports = router;