"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, CopyCheck } from "lucide-react";
import api from "@/lib/api";

export default function VerifyIssues() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingIssues();
  }, []);

  const fetchPendingIssues = async () => {
    try {
      const response = await api.get("/issues");
      // Filter only pending issues for verification
      const pending = response.data.filter((i: any) => i.status === "PENDING");
      setIssues(pending);
    } catch (error) {
      console.error("Failed to fetch pending issues", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await api.put(`/issues/${id}/status`, { status: "VERIFIED" });
      fetchPendingIssues(); // Refresh list
    } catch (e) {
      console.error("Failed to verify issue", e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <CopyCheck className="text-primary" size={32} />
          Verify New Issues
        </h1>
        <p className="text-foreground/60 mt-1">Review and approve reported issues before assigning them to departments.</p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 min-h-[400px]"
      >
        {loading ? (
          <div className="text-center py-10 opacity-50 flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            Loading pending issues...
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center opacity-70">
            <CheckCircle className="text-green-500 mb-4" size={48} />
            <h3 className="text-xl font-bold">All Caught Up!</h3>
            <p>There are no pending issues that require verification.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {issues.map((item) => (
              <div key={item._id} className="p-4 bg-primary/5  rounded-xl border border-white/10 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-white/10 transition-all">
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded text-foreground/70">
                          #SYS-{item._id.slice(-4).toUpperCase()}
                       </span>
                       <span className="text-xs font-bold bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded uppercase">
                          {item.priority} PRIORITY
                       </span>
                    </div>
                    <h4 className="font-bold text-lg text-foreground">{item.title}</h4>
                    <p className="text-sm text-foreground/60 mt-1">{item.description}</p>
                 </div>
                 <div className="flex shrink-0">
                    <button
                      onClick={() => handleVerify(item._id)}
                      className="w-full md:w-auto px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/80 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} /> Verify
                    </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
