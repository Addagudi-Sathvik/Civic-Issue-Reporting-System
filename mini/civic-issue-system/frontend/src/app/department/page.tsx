"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, Play, Check, MessageSquare, Loader2, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";

interface Issue {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  reporterId: { name: string; email: string };
  assignedDepartment?: string;
  departmentRemarks?: Array<{
    message: string;
    timestamp: string;
    userId: string;
    userRole: string;
  }>;
  createdAt: string;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export default function DepartmentDashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await api.get("/department/issues");
      setIssues(response.data.issues || response.data);
    } catch (error: any) {
      console.error("Failed to fetch assigned issues", error);
      showToast("Failed to load issues: " + (error.response?.data?.message || "Error"), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleUpdateStatus = async (issueId: string, newStatus: string, remarksText: string = "") => {
    setActionLoading(issueId);
    try {
      const payload: any = { status: newStatus };
      if (remarksText.trim()) {
        payload.remarks = remarksText;
      }

      await api.patch(`/department/issues/${issueId}/status`, payload);
      showToast(`✅ Issue marked as ${newStatus.replace('_', ' ')}`, 'success');
      fetchIssues();
      setSelectedIssue(null);
      setRemarks("");
    } catch (error: any) {
      console.error("Failed to update status", error);
      showToast("Failed to update: " + (error.response?.data?.message || "Error"), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddRemark = async (issueId: string) => {
    if (!remarks.trim()) {
      showToast("❌ Please enter a note", 'error');
      return;
    }
    await handleUpdateStatus(issueId, selectedIssue?.status || 'IN_PROGRESS', remarks);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 'bg-blue-500/20 text-blue-700 border border-blue-300';
      case 'IN_PROGRESS': return 'bg-orange-500/20 text-orange-700 border border-orange-300';
      case 'RESOLVED': return 'bg-green-500/20 text-green-700 border border-green-300';
      default: return 'bg-gray-500/20 text-gray-700 border border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-500/20 text-red-700 border border-red-300';
      case 'MEDIUM': return 'bg-orange-500/20 text-orange-700 border border-orange-300';
      case 'LOW': return 'bg-green-500/20 text-green-700 border border-green-300';
      default: return 'bg-gray-500/20 text-gray-700 border border-gray-300';
    }
  };

  const stats = [
    { label: "Assigned Issues", value: issues.length, icon: <AlertCircle size={24} className="text-blue-500" /> },
    { label: "In Progress", value: issues.filter(i => i.status === "IN_PROGRESS").length, icon: <Clock size={24} className="text-orange-500" /> },
    { label: "Resolved", value: issues.filter(i => i.status === "RESOLVED").length, icon: <CheckCircle size={24} className="text-green-500" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-foreground">Department Dashboard</h1>
          <p className="text-foreground/60 mt-1">Manage and resolve issues assigned to your department.</p>
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
                 <span className="text-xs font-bold px-3 py-1 bg-blue-500/20 text-blue-700 rounded-full">Live</span>
             </div>
             <div>
                <h3 className="text-4xl font-black text-foreground">{loading ? "-" : stat.value}</h3>
                <p className="text-foreground/60 text-sm font-semibold mt-2">{stat.label}</p>
             </div>
          </motion.div>
        ))}
      </div>

      {/* Issues Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {loading ? (
             <div className="flex items-center justify-center py-16">
               <Loader2 size={40} className="animate-spin text-primary opacity-50" />
             </div>
        ) : issues.length === 0 ? (
             <div className="text-center py-16 opacity-60 glass p-8 rounded-2xl border border-white/10">
               <AlertCircle size={40} className="mx-auto mb-4 opacity-40" />
               <p className="text-lg font-medium">No assigned issues</p>
             </div>
        ) : (
          issues.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 rounded-2xl border border-white/10 hover:border-primary/30 hover:bg-white/10 transition-all duration-300 shadow-md"
            >
               <div className="grid md:grid-cols-3 gap-6">
                  {/* Issue Details */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                        <p className="text-sm text-foreground/60 line-clamp-2 mt-1">{item.description}</p>
                      </div>
                      {item.priority === "HIGH" && (
                        <div className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                          URGENT
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className={`px-3 py-1 rounded-full font-bold ${getPriorityColor(item.priority)}`}>
                        {item.priority} Priority
                      </span>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-700 border border-blue-300 rounded-full font-bold">
                        📍 {item.category}
                      </span>
                      <span className={`px-3 py-1 rounded-full font-bold ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-foreground/60 bg-white/5 p-3 rounded-lg border border-white/10">
                      <span>👤 Reported by <strong>{item.reporterId?.name || 'Unknown'}</strong></span>
                      <br />
                      <span>📅 {new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Department Remarks */}
                    {item.departmentRemarks && item.departmentRemarks.length > 0 && (
                      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare size={16} className="text-foreground/60" />
                          <span className="text-sm font-bold text-foreground">Department Notes</span>
                        </div>
                        <div className="space-y-2 max-h-24 overflow-y-auto">
                          {item.departmentRemarks.slice(-3).map((remark, idx) => (
                            <div key={idx} className="text-xs bg-white/5 p-2 rounded border border-white/10">
                              <p className="text-foreground">{remark.message}</p>
                              <p className="text-foreground/50 mt-1 text-xs">
                                {new Date(remark.timestamp).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    {item.status === 'ASSIGNED' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          onClick={() => handleUpdateStatus(item._id, "IN_PROGRESS", "Started working on this issue")}
                          disabled={actionLoading === item._id}
                          className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                        >
                          {actionLoading === item._id ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                          Start Work
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedIssue(item)}
                          className="w-full py-3 bg-white/10 hover:bg-white/20 text-foreground font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-white/20"
                        >
                          <MessageSquare size={18} />
                          Add Note
                        </motion.button>
                      </>
                    )}

                    {item.status === 'IN_PROGRESS' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedIssue(item)}
                          className="w-full py-3 bg-white/10 hover:bg-white/20 text-foreground font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-white/20"
                        >
                          <MessageSquare size={18} />
                          Update Progress
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          onClick={() => handleUpdateStatus(item._id, "RESOLVED", "Issue has been successfully resolved")}
                          disabled={actionLoading === item._id}
                          className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                        >
                          {actionLoading === item._id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                          Mark Resolved
                        </motion.button>
                      </>
                    )}

                    {item.status === 'RESOLVED' && (
                      <div className="py-3 px-4 bg-green-500/20 text-green-700 font-bold rounded-xl text-center border border-green-300">
                        ✅ Completed
                      </div>
                    )}
                  </div>
               </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Remarks Modal */}
      <AnimatePresence>
        {selectedIssue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => { setSelectedIssue(null); setRemarks(""); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-50 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare size={24} className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-800">Update Progress</h3>
              </div>
              <div className="bg-slate-100 p-3 rounded-lg mb-4">
                <p className="text-sm font-bold text-slate-800">{selectedIssue.title}</p>
                <p className="text-xs text-slate-600 mt-1">Current Status: <span className="font-bold">{selectedIssue.status.replace('_', ' ')}</span></p>
              </div>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter your progress update, findings, or completion details..."
                className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={5}
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setSelectedIssue(null); setRemarks(""); }}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddRemark(selectedIssue._id)}
                  disabled={actionLoading !== null}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  Save Update
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
