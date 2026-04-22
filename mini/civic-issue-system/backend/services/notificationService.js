const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail', // You can change this to your email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const getEmailTemplate = (type, data) => {
  const templates = {
    ISSUE_APPROVED: {
      subject: 'Your Issue Has Been Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Issue Approved ✅</h2>
          <p>Dear Citizen,</p>
          <p>Your reported issue "<strong>${data.title}</strong>" has been verified and approved by our administrators.</p>
          <p><strong>Assigned Department:</strong> ${data.department}</p>
          <p>The issue has been forwarded to the relevant department for resolution. You will receive updates as the issue progresses.</p>
          <p>Thank you for helping make our city better!</p>
          <br>
          <p>Best regards,<br>Civic Connect Team</p>
        </div>
      `
    },
    ISSUE_REJECTED: {
      subject: 'Issue Report Update',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Issue Report Update</h2>
          <p>Dear Citizen,</p>
          <p>After careful review, your reported issue "<strong>${data.title}</strong>" could not be approved at this time.</p>
          <p><strong>Reason:</strong> ${data.reason}</p>
          <p>If you believe this decision was made in error or have additional information, please submit a new report with more details.</p>
          <p>Thank you for your understanding.</p>
          <br>
          <p>Best regards,<br>Civic Connect Team</p>
        </div>
      `
    },
    ISSUE_ASSIGNED: {
      subject: 'Issue Assigned to Department',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Issue Assigned 📋</h2>
          <p>Dear Citizen,</p>
          <p>Your issue "<strong>${data.title}</strong>" has been assigned to the <strong>${data.department}</strong> department.</p>
          <p>They will begin working on resolving this issue shortly. You will receive updates on the progress.</p>
          <br>
          <p>Best regards,<br>Civic Connect Team</p>
        </div>
      `
    },
    ISSUE_IN_PROGRESS: {
      subject: 'Issue Work In Progress',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Work In Progress 🔄</h2>
          <p>Dear Citizen,</p>
          <p>Great news! Work has begun on your reported issue "<strong>${data.title}</strong>".</p>
          <p>The assigned department is actively working to resolve this issue. You will be notified once it's completed.</p>
          <br>
          <p>Best regards,<br>Civic Connect Team</p>
        </div>
      `
    },
    ISSUE_RESOLVED: {
      subject: 'Issue Resolved Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Issue Resolved ✅</h2>
          <p>Dear Citizen,</p>
          <p>Excellent news! Your reported issue "<strong>${data.title}</strong>" has been successfully resolved.</p>
          <p>Thank you for your patience and for helping improve our community. Your feedback helps us serve you better.</p>
          <p>If you encounter any similar issues in the future, please don't hesitate to report them.</p>
          <br>
          <p>Best regards,<br>Civic Connect Team</p>
        </div>
      `
    }
  };

  return templates[type] || {
    subject: 'Civic Connect Update',
    html: '<p>You have a notification from Civic Connect.</p>'
  };
};

// Send notification
const sendNotification = async (userEmail, type, data) => {
  try {
    // If email is not configured, just log
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`EMAIL NOTIFICATION (${type}):`, { userEmail, data });
      return;
    }

    const transporter = createTransporter();
    const template = getEmailTemplate(type, data);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${userEmail}:`, result.messageId);

  } catch (error) {
    console.error('Email notification error:', error);
  }
};

module.exports = { sendNotification };