# Civic Issue Reporting System - Workflow Implementation

## 🎯 Overview

This system implements a comprehensive civic issue reporting workflow with admin verification, department assignment, and resolution tracking.

## 🔄 Workflow Status Flow

```
PENDING_VERIFICATION → VERIFIED → ASSIGNED → IN_PROGRESS → RESOLVED
                        ↓
                     REJECTED
```

## 📋 Database Schema Updates

### Issue Model Fields Added:
- `verificationStatus`: 'PENDING' | 'APPROVED' | 'REJECTED'
- `assignedDepartment`: Department type (ROADS, WATER, etc.)
- `assignedDepartmentId`: Reference to department user
- `adminRemarks`: Admin comments
- `departmentRemarks`: Array of department notes
- `rejectionReason`: Reason for rejection
- Timestamps: `verifiedAt`, `assignedAt`, `inProgressAt`

## 🔧 Backend API Endpoints

### Admin Endpoints:
- `POST /issues/:id/approve` - Approve and auto-assign department
- `POST /issues/:id/reject` - Reject with reason
- `POST /issues/:id/assign-department` - Manual department assignment
- `GET /issues/status?status=...` - Get filtered issues
- `GET /issues/departments/users` - Get department users

### Department Endpoints:
- `PUT /issues/:id/department-status` - Update status with remarks
- `GET /issues/status?status=ASSIGNED,IN_PROGRESS` - Get assigned issues

## 🎨 Frontend Updates

### Admin Dashboard (`/admin`):
- Filter issues by verification status
- Approve/Reject pending issues
- Assign departments manually
- View all issues with full details

### Department Dashboard (`/department`):
- View only assigned issues
- Update status: ASSIGNED → IN_PROGRESS → RESOLVED
- Add progress notes/remarks
- Modal for adding detailed notes

## 📧 Notification System

### Email Templates:
- **ISSUE_APPROVED**: Issue verified and assigned
- **ISSUE_REJECTED**: Issue rejected with reason
- **ISSUE_ASSIGNED**: Department assignment confirmed
- **ISSUE_IN_PROGRESS**: Work started notification
- **ISSUE_RESOLVED**: Resolution completion

### Configuration:
```env
# Backend .env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 🚀 Setup Instructions

### 1. Database Migration
The Issue model will automatically update with new fields on server restart.

### 2. Environment Configuration

**Backend (.env):**
```env
MONGODB_URI=mongodb://localhost:27017/civic-issue-system
JWT_SECRET=your_jwt_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. User Roles Setup
Create users with appropriate roles:
- `ADMIN`: Full system access
- `DEPARTMENT`: Department-specific access
- `USER`: Regular citizen access

### 4. Department Types
Supported department types:
- `ROADS`
- `WATER`
- `GARBAGE`
- `ELECTRICITY`
- `OTHER`

## 🔐 Security & Permissions

### Admin Permissions:
- View all issues
- Approve/Reject reports
- Assign departments
- Add admin remarks

### Department Permissions:
- View only assigned issues
- Update issue status
- Add department remarks
- Mark issues as resolved

### User Permissions:
- Create new issues
- View own issues
- Vote on issues
- Cannot modify after submission

## 📊 Status Definitions

- **PENDING_VERIFICATION**: New issue awaiting admin review
- **VERIFIED**: Approved by admin, ready for assignment
- **ASSIGNED**: Department assigned, awaiting work start
- **IN_PROGRESS**: Department actively working
- **RESOLVED**: Issue successfully completed
- **REJECTED**: Issue deemed invalid/fake

## 🎯 Testing the Workflow

1. **Create Issue** (as USER):
   - Submit new issue → Status: PENDING_VERIFICATION

2. **Admin Review** (as ADMIN):
   - View pending issues
   - Approve → Auto-assign department
   - Or Reject → Provide reason

3. **Department Work** (as DEPARTMENT):
   - View assigned issues
   - Start work → IN_PROGRESS
   - Add progress notes
   - Mark resolved → RESOLVED

4. **User Notifications**:
   - Receive email at each status change

## 🔧 Troubleshooting

### Common Issues:

1. **Email not sending**: Check EMAIL_USER/EMAIL_PASS in backend .env
2. **Department not assigned**: Ensure department users exist with matching departmentType
3. **Permission denied**: Verify user roles in database
4. **Map not loading**: Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

### Debug Commands:
```bash
# Check user roles
db.users.find({}, {name:1, email:1, role:1, departmentType:1})

# Check issue statuses
db.issues.find({}, {title:1, status:1, verificationStatus:1, assignedDepartment:1})
```

## 🚀 Production Deployment

1. Set up production email service (SendGrid, AWS SES, etc.)
2. Configure production database
3. Set secure JWT secrets
4. Enable HTTPS
5. Set up monitoring/logging
6. Configure backup systems

## 📈 Future Enhancements

- Push notifications
- SMS alerts
- Advanced analytics dashboard
- Bulk operations for admins
- Issue escalation system
- Performance metrics tracking
- Integration with government systems