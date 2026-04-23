const Issue = require('../models/Issue');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { sendNotification } = require('../services/notificationService');

// --- Helper Functions ---

function fileToGenerativePart(filePath, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType
        },
    };
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; 
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) { return deg * (Math.PI / 180) }

function calculatePriority(votes) {
    if (votes >= 20) return 'HIGH';
    if (votes >= 5) return 'MEDIUM';
    return 'LOW';
}

// --- Controller Endpoints ---

exports.createIssue = async (req, res) => {
    try {
        let { title, description, category, location } = req.body;

        if (typeof location === 'string') {
            try {
                location = JSON.parse(location);
            } catch (err) {
                console.error("Error parsing location:", err);
            }
        }

        let media = [];
        if (req.files && req.files.length > 0) {
            media = req.files.map(file => `/uploads/${file.filename}`);
        } else if (req.body.media) {
            media = Array.isArray(req.body.media) ? req.body.media : [req.body.media];
        }

        const issue = new Issue({
            title,
            description,
            category,
            location,
            media,
            reporterId: req.user.userId,
            status: 'PENDING_VERIFICATION',
            verificationStatus: 'PENDING',
        });

        await issue.save();

        // Award Gamification Points: +60
        await User.findByIdAndUpdate(req.user.userId, { $inc: { points: 60 } });

        res.status(201).json(issue);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getIssues = async (req, res) => {
    try {
        const issues = await Issue.find()
            .populate('reporterId', 'name email')
            .populate('assignedDepartmentId', 'name departmentType')
            .sort({ createdAt: -1 });
        res.json(issues);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getIssueById = async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id)
            .populate('reporterId', 'name email')
            .populate('assignedDepartmentId', 'name departmentType');

        if (!issue) return res.status(404).json({ message: 'Issue not found' });
        res.json(issue);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.validateImage = async (req, res) => {
    try {
        const { category } = req.body;

        if (!category) {
            return res.status(400).json({ valid: false, message: "Category is required" });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(200).json({
                valid: true,
                category: category,
                confidence: 80,
                message: "Simulated validation (no AI key)",
            });
        }

        if (!req.file) {
            return res.status(400).json({ valid: false, message: "No image uploaded" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Analyze this image and return ONLY JSON:
            {
              "category": "ROADS|GARBAGE|ELECTRICITY|WATER|OTHER",
              "confidence": number,
              "objects_detected": ["object1", "object2"]
            }
        `;

        const imageParts = [fileToGenerativePart(req.file.path, req.file.mimetype)];
        const result = await model.generateContent([prompt, ...imageParts]);
        let responseText = result.response.text().trim();

        // Clean markdown and extract JSON
        if (responseText.includes("```")) {
            responseText = responseText.replace(/```json/gi, "").replace(/```/gi, "").trim();
        }
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid AI response");

        const aiData = JSON.parse(jsonMatch[0]);
        let mappedCategory = (aiData.category || "OTHER").toUpperCase();

        // Normalization logic
        if (mappedCategory.includes("ROAD")) mappedCategory = "ROADS";
        else if (mappedCategory.includes("GARBAGE") || mappedCategory.includes("TRASH")) mappedCategory = "GARBAGE";
        else if (mappedCategory.includes("ELECTR") || mappedCategory.includes("LIGHT")) mappedCategory = "ELECTRICITY";
        else if (mappedCategory.includes("WATER") || mappedCategory.includes("FLOOD")) mappedCategory = "WATER";

        const confidence = Number(aiData.confidence) || 0;
        const userCategory = category.toUpperCase();

        // Strict Validation Check
        const isMismatch = (mappedCategory !== userCategory && mappedCategory !== 'OTHER' && userCategory !== 'OTHER');

        if (isMismatch) {
            return res.status(400).json({
                valid: false,
                category: mappedCategory,
                confidence,
                message: `❌ Mismatch. You selected ${userCategory}, but AI detected ${mappedCategory}.`
            });
        }

        if (confidence < 50) {
            return res.status(400).json({
                valid: false,
                category: mappedCategory,
                confidence,
                message: `❌ Image clarity too low (${confidence}%). Please provide a clearer photo.`
            });
        }

        return res.status(200).json({
            valid: true,
            category: mappedCategory,
            confidence,
            objects_detected: aiData.objects_detected,
            message: `✅ Image verified (${confidence}% confidence)`,
        });

    } catch (error) {
        console.error("Validation error:", error);
        return res.status(500).json({ valid: false, message: "Server error during validation" });
    }
};

exports.getNearbyIssues = async (req, res) => {
    try {
        const { lat, lng, category, radiusKm = 3 } = req.body;
        if (!lat || !lng) return res.status(400).json({ message: 'lat and lng required' });

        let query = {};
        if (category) query.category = category;

        const allIssues = await Issue.find(query);
        const nearby = allIssues.filter(issue => {
            if (!issue.location || !issue.location.lat || !issue.location.lng) return false;
            const d = getDistanceFromLatLonInKm(lat, lng, issue.location.lat, issue.location.lng);
            return d <= radiusKm;
        });

        res.json(nearby);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.voteIssue = async (req, res) => {
    try {
        const issueId = req.params.id;
        const userId = req.user.userId;

        const issue = await Issue.findById(issueId);
        if (!issue) return res.status(404).json({ message: 'Issue not found' });

        if (issue.voters && issue.voters.includes(userId)) {
            return res.status(400).json({ message: 'Already voted' });
        }

        issue.votes = (issue.votes || 0) + 1;
        issue.voters.push(userId);
        issue.priority = calculatePriority(issue.votes);

        await issue.save();

        await ActivityLog.create({
            issueId: issue._id,
            action: 'VOTE_ADDED',
            performedBy: userId,
            remarks: `Votes: ${issue.votes}`
        });

        await User.findByIdAndUpdate(userId, { $inc: { points: 5 } });

        res.json(issue);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.approveIssue = async (req, res) => {
    try {
        const { adminRemarks } = req.body;
        const issue = await Issue.findById(req.params.id).populate('reporterId', 'name email');

        if (!issue) return res.status(404).json({ message: 'Issue not found' });
        if (issue.verificationStatus !== 'PENDING') return res.status(400).json({ message: 'Processed already' });

        const departmentMapping = { 'ROADS': 'ROADS', 'WATER': 'WATER', 'GARBAGE': 'GARBAGE', 'ELECTRICITY': 'ELECTRICITY', 'OTHER': 'OTHER' };
        const assignedDept = departmentMapping[issue.category] || 'OTHER';

        const deptUser = await User.findOne({ role: 'DEPARTMENT', departmentType: assignedDept });

        issue.verificationStatus = 'APPROVED';
        issue.status = 'VERIFIED';
        issue.adminRemarks = adminRemarks;
        issue.assignedDepartment = assignedDept;
        issue.assignedDepartmentId = deptUser ? deptUser._id : null;
        issue.verifiedAt = new Date();

        await issue.save();

        await sendNotification(issue.reporterId.email, 'ISSUE_APPROVED', { issueId: issue._id, title: issue.title });

        res.json({ message: 'Issue approved', issue });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.rejectIssue = async (req, res) => {
    try {
        const { rejectionReason, adminRemarks } = req.body;
        const issue = await Issue.findById(req.params.id).populate('reporterId', 'name email');

        if (!issue) return res.status(404).json({ message: 'Issue not found' });

        issue.verificationStatus = 'REJECTED';
        issue.status = 'REJECTED';
        issue.rejectionReason = rejectionReason;
        issue.adminRemarks = adminRemarks;

        await issue.save();

        await sendNotification(issue.reporterId.email, 'ISSUE_REJECTED', { issueId: issue._id, reason: rejectionReason });

        res.json({ message: 'Issue rejected', issue });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateDepartmentStatus = async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const userId = req.user.userId;
        const issue = await Issue.findById(req.params.id).populate('reporterId', 'name email');

        if (!issue) return res.status(404).json({ message: 'Issue not found' });
        if (issue.assignedDepartmentId.toString() !== userId) return res.status(403).json({ message: 'Unauthorized' });

        issue.status = status;
        if (remarks) {
            issue.departmentRemarks.push({ message: remarks, userId, userRole: 'DEPARTMENT' });
        }

        if (status === 'RESOLVED') issue.resolvedAt = new Date();
        await issue.save();

        await sendNotification(issue.reporterId.email, 'ISSUE_STATUS_UPDATED', { title: issue.title, status });

        res.json({ message: `Updated to ${status}`, issue });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getIssuesByStatus = async (req, res) => {
    try {
        const { status, department } = req.query;
        const { role, userId } = req.user;

        let query = {};
        if (status) query.status = Array.isArray(status) ? { $in: status } : status;

        if (role === 'DEPARTMENT') query.assignedDepartmentId = userId;
        else if (role === 'USER') query.reporterId = userId;

        if (department) query.assignedDepartment = department;

        const issues = await Issue.find(query).populate('reporterId', 'name email').sort({ createdAt: -1 });
        res.json(issues);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getIssueActivityLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.find({ issueId: req.params.id })
            .populate('performedBy', 'name email role')
            .sort({ createdAt: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
