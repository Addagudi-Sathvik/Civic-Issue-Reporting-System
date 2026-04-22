const express = require('express');
const router = express.Router();
const confirmationController = require('../controllers/confirmationController');
const { authMiddleware } = require('../middlewares/auth');

// Add confirmation to an issue
router.post('/:id/confirm', authMiddleware, confirmationController.addConfirmation);

// Get confirmations for an issue
router.get('/:id/confirmations', authMiddleware, confirmationController.getIssueConfirmations);

// Get user's confirmations
router.get('/user/confirmations', authMiddleware, confirmationController.getUserConfirmations);

module.exports = router;