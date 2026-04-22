"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Clock, CheckCircle, Check, X, UserCheck, Loader2, MessageCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

interface Issue {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  verificationStatus: string;
  priority: string;
  reporterId: { name: string; email: string };
  assignedDepartment?: string;
  assignedDepartmentId?: { name: string; departmentType: string };
  createdAt: string;
  adminRemarks?: string;
  rejectionReason?: string;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function AdminOverview() {
  const [filter, setFilter] = useState("PENDING_VERIFICATION");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentUsers, setDepartmentUsers] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; issueId: string; reason: string }>({ isOpen: false, issueId: '', reason: '' });
  const [assignModal, setAssignModal] = useState<{ isOpen: boolean; issueId: string; dept: string }>({ isOpen: false, issueId: '', dept: '' });

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/issues?status=${filter}`);
      setIssues(response.data.issues || response.data);
    } catch (error: any) {
      console.error("Failed to fetch issues", error);
      showToast("Failed to load issues: " + (error.response?.data?.message || "Server error"), 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchDepartmentUsers = useCallback(async () => {
    try {
      const response = await api.get('/admin/department-users');
      setDepartmentUsers(response.data);
    } catch (error: any) {
      console.error("Failed to fetch department users", error);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
    fetchDepartmentUsers();
  }, [fetchIssues, fetchDepartmentUsers]);

  const handleApprove = async (issueId: string) => {
    setActionLoading(issueId);
    try {
      await api.post(`/admin/approve`, {
        issueId,
        remarks: "Issue verified and approved for processing"
      });
      showToast("✅ Issue approved successfully", 'success');
      fetchIssues();
    } catch (error: any) {
      console.error("Failed to approve issue", error);
      showToast("Failed to approve: " + (error.response?.data?.message || "Error"), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionModal.reason.trim()) {
      showToast("❌ Please enter a rejection reason", 'error');
      return;
    }
    setActionLoading(rejectionModal.issueId);
    try {
      await api.post(`/admin/reject`, {
        issueId: rejectionModal.issueId,
        rejectionReason: rejectionModal.reason
      });
      showToast("✅ Issue rejected successfully", 'success');
      setRejectionModal({ isOpen: false, issueId: '', reason: '' });
      fetchIssues();
    } catch (error: any) {
      console.error("Failed to reject issue", error);
      showToast("Failed to reject: " + (error.response?.data?.message || "Error"), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignSubmit = async () => {
    if (!assignModal.dept.trim()) {
      showToast("❌ Please select a department", 'error');
      return;
    }
    setActionLoading(assignModal.issueId);
    try {
      const deptUser = departmentUsers.find(user => user.departmentType === assignModal.dept);
      await api.post(`/admin/assign`, {
        issueId: assignModal.issueId,
        departmentUserId: deptUser?._id
      });
      showToast("✅ Issue assigned successfully", 'success');
      setAssignModal({ isOpen: false, issueId: '', dept: '' });
      fetchIssues();
    } catch (error: any) {
      console.error("Failed to assign department", error);
      showToast("Failed to assign: " + (error.response?.data?.message || "Error"), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_VERIFICATION': return 'bg-yellow-500/20 text-yellow-700 border border-yellow-300';
      case 'VERIFIED': return 'bg-blue-500/20 text-blue-700 border border-blue-300';
      case 'ASSIGNED': return 'bg-purple-500/20 text-purple-700 border border-purple-300';
      case 'IN_PROGRESS': return 'bg-orange-500/20 text-orange-700 border border-orange-300';
      case 'RESOLVED': return 'bg-green-500/20 text-green-700 border border-green-300';
      case 'REJECTED': return 'bg-red-500/20 text-red-700 border border-red-300';
      default: return 'bg-gray-500/20 text-gray-700 border border-gray-300';
    }
  };

  const stats = [
    { label: "Total Issues", value: issues.length, icon: <AlertCircle size={24} className="text-blue-500" /> },
    { label: "Pending Verification", value: issues.filter(i => i.verificationStatus === "PENDING").length, icon: <Clock size={24} className="text-yellow-500" /> },
    { label: "Resolved", value: issues.filter(i => i.status === "RESOLVED").length, icon: <CheckCircle size={24} className="text-green-500" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-foreground">Admin Overview</h1>
          <p className="text-foreground/60 mt-1">Manage system-wide civic issues and verify reports.</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-2xl border border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 shadow-md"
          >
             <div className="flex justify-between items-start mb-4">
                 <div className="p-3 bg-gradient-to-br from-primary/50 to-secondary/50 rounded-xl shadow-lg">
                   {stat.icon}
                 </div>
                 <span className="text-xs font-bold px-3 py-1 bg-green-500/20 text-green-700 rounded-full">Active</span>
             </div>
             <div>
                <h3 className="text-4xl font-black text-foreground">{loading ? "-" : stat.value}</h3>
                <p className="text-foreground/60 text-sm font-semibold mt-2">{stat.label}</p>
             </div>
          </motion.div>
        ))}
      </div>

      {/* Issue Management Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass p-8 rounded-2xl border border-white/10 shadow-xl"
      >
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
           <h2 className="text-2xl font-bold text-foreground">Issue Management</h2>

           <select
             value={filter}
             onChange={(e) => setFilter(e.target.value)}
             className="glass-input px-4 py-2 text-sm rounded-xl border border-white/20 hover:border-primary/50 transition-colors"
           >
             <option value="PENDING_VERIFICATION">Pending Verification</option>
             <option value="VERIFIED">Verified</option>
             <option value="ASSIGNED">Assigned</option>
             <option value="IN_PROGRESS">In Progress</option>
             <option value="RESOLVED">Resolved</option>
             <option value="REJECTED">Rejected</option>
           </select>
        </div>

        {/* Loading State */}
        {loading ? (
           <div className="flex items-center justify-center py-16">
             <Loader2 size={40} className="animate-spin text-primary opacity-50" />
           </div>
        ) : issues.length === 0 ? (
           <div className="text-center py-16 opacity-60">
             <AlertCircle size={40} className="mx-auto mb-4 opacity-40" />
             <p className="text-lg font-medium">No issues in this category</p>
           </div>
        ) : (
          <div className="space-y-4">
            {issues.map((item) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-xl transition-all duration-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{item.title}</h3>
                      <p className="text-sm text-foreground/60 line-clamp-1">{item.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-foreground/70">
                    <span>📍 <strong>{item.category}</strong></span>
                    <span>👤 {item.reporterId?.name || 'Unknown'}</span>
                    <span>🏢 {item.assignedDepartmentId?.name || 'Unassigned'}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                  {item.verificationStatus === 'PENDING' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleApprove(item._id)}
                        disabled={actionLoading === item._id}
                        className="flex items-center gap-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/40 text-green-700 font-bold rounded-lg text-xs transition-all duration-200 disabled:opacity-50"
                      >
                        {actionLoading === item._id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Approve
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setRejectionModal({ isOpen: true, issueId: item._id, reason: '' })}
                        disabled={actionLoading === item._id}
                        className="flex items-center gap-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-700 font-bold rounded-lg text-xs transition-all duration-200 disabled:opacity-50"
                      >
                        <X size={14} />
                        Reject
                      </motion.button>
                    </>
                  )}
                  {item.status === 'VERIFIED' && !item.assignedDepartmentId && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setAssignModal({ isOpen: true, issueId: item._id, dept: '' })}
                      disabled={actionLoading === item._id}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-700 font-bold rounded-lg text-xs transition-all duration-200 disabled:opacity-50"
                    >
                      {actionLoading === item._id ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                      Assign
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectionModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setRejectionModal({ isOpen: false, issueId: '', reason: '' })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-50 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle size={24} className="text-red-600" />
                <h3 className="text-lg font-bold text-slate-800">Reject Issue</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">Provide a reason for rejecting this issue:</p>
              <textarea
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                placeholder="Enter rejection reason..."
                className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={4}
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setRejectionModal({ isOpen: false, issueId: '', reason: '' })}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={actionLoading !== null}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Modal */}
      <AnimatePresence>
        {assignModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setAssignModal({ isOpen: false, issueId: '', dept: '' })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-50 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <UserCheck size={24} className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-800">Assign Department</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">Select a department to assign this issue:</p>
              <select
                value={assignModal.dept}
                onChange={(e) => setAssignModal({ ...assignModal, dept: e.target.value })}
                className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Department --</option>
                <option value="ROADS">Roads & Infrastructure</option>
                <option value="WATER">Water & Sanitation</option>
                <option value="GARBAGE">Waste Management</option>
                <option value="ELECTRICITY">Electricity & Power</option>
                <option value="OTHER">Other</option>
              </select>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setAssignModal({ isOpen: false, issueId: '', dept: '' })}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignSubmit}
                  disabled={actionLoading !== null}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  Assign
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Messages */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl font-bold text-white shadow-xl ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
