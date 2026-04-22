"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import api from "@/lib/api";

export default function ResolvedIssues() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    try {
      const response = await api.get("/issues");
      const assignedIssues = response.data.filter((i: any) => i.status === "RESOLVED");
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

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resolved Issues</h1>
          <p className="text-foreground/60 mt-1">Archive of issues resolved by the Department.</p>
        </div>
      </header>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
             <div className="col-span-full opacity-50 text-center py-10">Loading issues...</div>
        ) : issues.length === 0 ? (
             <div className="col-span-full opacity-50 text-center py-10">No resolved issues found.</div>
        ) : (
          issues.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-6 flex flex-col space-y-4 relative overflow-hidden opacity-80"
            >
               <div className="flex justify-between items-start">
                  <div>
                     <span className={`px-2 py-1 rounded text-xs font-bold ${item.priority === 'URGENT' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                       {item.priority} priority
                     </span>
                     <h3 className="text-xl font-bold text-foreground mt-2 line-through opacity-70">{item.title}</h3>
                     <p className="text-sm text-foreground/60 mt-1 max-w-sm">
                        {item.description}
                     </p>
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-green-500/20 flex flex-col items-center justify-center text-green-500 flex-shrink-0">Proof</div>
               </div>

               <div className="flex bg-white/20  p-3 rounded-xl justify-between items-center text-sm border border-white/10">
                  <span className="font-semibold text-foreground/80">Status: <span className="text-green-600 font-black">{item.status}</span></span>
                  <span className="text-foreground/50">ID: #CVC-{item._id.slice(-4).toUpperCase()}</span>
               </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
