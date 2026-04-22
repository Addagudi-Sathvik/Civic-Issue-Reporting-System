"use client";

import { motion } from "framer-motion";
import { Upload, Check } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";

export default function InProgressIssues() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    try {
      const response = await api.get("/issues");
      const assignedIssues = response.data.filter((i: any) => i.status === "IN_PROGRESS");
      setIssues(assignedIssues);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/issues/${id}/status`, { status: newStatus });
      fetchIssues(); // Refresh list
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">In Progress Issues</h1>
          <p className="text-foreground/60 mt-1">Issues actively being worked on by your department.</p>
        </div>
      </header>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
             <div className="col-span-full opacity-50 text-center py-10">Loading issues...</div>
        ) : issues.length === 0 ? (
             <div className="col-span-full opacity-50 text-center py-10">No in-progress issues found.</div>
        ) : (
          issues.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-6 flex flex-col space-y-4 relative overflow-hidden"
            >
               {item.priority === "URGENT" && <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>}

               <div className="flex justify-between items-start">
                  <div>
                     <span className={`px-2 py-1 rounded text-xs font-bold ${item.priority === 'URGENT' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                       {item.priority} priority
                     </span>
                     <h3 className="text-xl font-bold text-foreground mt-2">{item.title}</h3>
                     <p className="text-sm text-foreground/60 mt-1 max-w-sm">
                        {item.description}
                     </p>
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse flex-shrink-0"></div>
               </div>

               <div className="flex bg-white/20  p-3 rounded-xl justify-between items-center text-sm border border-white/10">
                  <span className="font-semibold text-foreground/80">Status: <span className="text-yellow-600">{item.status}</span></span>
                  <span className="text-foreground/50">ID: #CVC-{item._id.slice(-4).toUpperCase()}</span>
               </div>

               <div className="mt-4 pt-4 border-t border-white/10">
                 <p className="text-sm font-semibold mb-2">Resolve Issue</p>
                 <button className="w-full py-6 border-2 border-dashed border-green-500/50 rounded-xl text-green-600 flex flex-col items-center justify-center hover:bg-green-500/10 transition-colors">
                    <Upload size={24} className="mb-2" />
                    <span className="font-medium text-sm">Upload Proof of Completion</span>
                 </button>
                 <button onClick={() => handleUpdateStatus(item._id, "RESOLVED")} className="w-full mt-2 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <Check size={18} /> Submit Resolution
                 </button>
               </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
