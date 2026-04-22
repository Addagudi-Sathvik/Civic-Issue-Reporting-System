const Confirmation = require('../models/Confirmation');
const Issue = require('../models/Issue');
const ActivityLog = require('../models/ActivityLog');

// Add confirmation to an issue
exports.addConfirmation = async (req, res) => {
  try {
    const issueId = req.params.id;
    const userId = req.user.userId;
    const { confidence } = req.body;

    // Check if issue exists
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check if user already confirmed this issue
    const existingConfirmation = await Confirmation.findOne({
      issueId,
      userId
    });

    if (existingConfirmation) {
      return res.status(400).json({ message: 'You have already confirmed this issue' });
    }

    // Create confirmation
    const confirmation = new Confirmation({
      issueId,
      userId,
      confidence: confidence || 5 // Default confidence
    });

    await confirmation.save();

    // Update issue confirmation count
    await Issue.findByIdAndUpdate(issueId, {
      $inc: { confirmationCount: 1 }
    });

    // Log activity
    await ActivityLog.create({
      issueId,
      action: 'CROWD_CONFIRMED',
      performedBy: userId,
      remarks: `Crowd confirmation added with confidence ${confidence || 5}`,
      metadata: { confidence: confidence || 5 }
    });

    res.status(201).json({
      message: 'Confirmation added successfully',
      confirmation
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get confirmations for an issue
exports.getIssueConfirmations = async (req, res) => {
  try {
    const issueId = req.params.id;

    const confirmations = await Confirmation.find({ issueId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(confirmations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's confirmations
exports.getUserConfirmations = async (req, res) => {
  try {
    const userId = req.user.userId;

    const confirmations = await Confirmation.find({ userId })
      .populate('issueId', 'title category status')
      .sort({ createdAt: -1 });

    res.json(confirmations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};