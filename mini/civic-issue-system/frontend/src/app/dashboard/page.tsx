"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export default function UserDashboard() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  const [points, setPoints] = useState(0);

  useEffect(() => {
    const fetchIssuesAndUser = async () => {
      try {
        const [issuesRes, userRes] = await Promise.all([
          api.get("/issues"),
          api.get("/auth/me")
        ]);
        
        const userIssues = issuesRes.data.filter((i: any) => i.reporterId?._id === user?.id);
        setIssues(userIssues);
        setPoints(userRes.data.points || 0);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchIssuesAndUser();
  }, [user]);

  const stats = [
    { label: "Total Reports", value: issues.length, icon: <AlertCircle size={24} className="text-blue-500" /> },
    { label: "Pending", value: issues.filter(i => i.status === "PENDING" || i.status === "VERIFIED").length, icon: <Clock size={24} className="text-yellow-500" /> },
    { label: "Resolved", value: issues.filter(i => i.status === "RESOLVED").length, icon: <CheckCircle size={24} className="text-green-500" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-foreground/60 mt-1">Track the status of your reported issues here.</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="glass p-6 flex flex-col justify-between border-2 border-primary/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50 relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="text-6xl font-black">⭐</span>
           </div>
           <div>
              <p className="text-secondary text-sm font-bold uppercase tracking-wider">My Points</p>
              <h3 className="text-4xl font-extrabold text-slate-800 mt-2">{loading ? "-" : points}</h3>
           </div>
           <div className="mt-4 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-full" style={{ width: `${Math.min(100, (points / 500) * 100)}%` }}></div>
           </div>
           <p className="text-xs font-medium text-slate-500 mt-2">{500 - points > 0 ? `${500 - points} points to next Reward Tier` : 'You reached Max Tier!'}</p>
        </motion.div>

        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 flex items-center justify-between col-span-1 border border-slate-200"
          >
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{loading ? "-" : stat.value}</h3>
            </div>
            <div className="p-4 bg-slate-100 rounded-full shadow-inner">
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity / Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass p-6 mt-8"
      >
        <h2 className="text-xl font-bold text-foreground mb-6">Recent Reports</h2>
        
        <div className="space-y-4">
          {loading ? (
             <div className="opacity-50 text-center py-4">Loading from DB...</div>
          ) : issues.length === 0 ? (
             <div className="opacity-50 text-center py-4">You haven&apos;t reported any issues yet.</div>
          ) : (
             issues.map((item) => (
              <div key={item._id} className="flex items-center justify-between p-4 bg-white/40  rounded-xl hover:bg-white/60 transition-colors cursor-pointer border border-white/10">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg flex-shrink-0 animate-pulse"></div>
                    <div>
                      <h4 className="font-semibold text-foreground">{item.title}</h4>
                      <p className="text-sm text-foreground/60">Category: {item.category}</p>
                    </div>
                 </div>
                 <div className="flex flex-col items-end">
                   <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'RESOLVED' ? 'bg-green-500/20 text-green-600' : 'bg-yellow-500/20 text-yellow-600'}`}>
                     {item.status}
                   </span>
                   <p className="text-xs text-foreground/50 mt-1">ID: #CVC-{item._id.slice(-4).toUpperCase()}</p>
                 </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
