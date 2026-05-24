"use client";

import { motion } from "framer-motion";
import { HardHat, Bell, Building } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState } from "react";

export default function DepartmentSettings() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state while hydrating
  if (!mounted || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Department Configuration</h1>
          <p className="text-foreground/60 mt-1">Manage notification scopes and departmental info.</p>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Department Configuration</h1>
        <p className="text-foreground/60 mt-1">Manage notification scopes and departmental info.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-1 space-y-4">
            <div className="glass p-6 flex flex-col items-center text-center">
               <div className="w-24 h-24 bg-secondary text-white rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg shadow-secondary/30">
                  <HardHat size={40} />
               </div>
               <h3 className="font-bold text-xl">{user?.name || "Department User"}</h3>
               <p className="text-foreground/60 text-sm">{user?.role === "DEPARTMENT" ? "Supervisor" : ""}</p>
            </div>
         </motion.div>

         <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="md:col-span-2 space-y-6">
            <div className="glass p-8">
               <h3 className="text-lg font-semibold flex items-center gap-2 mb-6"><Building size={20} className="text-primary" /> Authority Details</h3>
               <div className="space-y-4">
                  <div>
                     <label className="text-sm font-medium text-foreground/80 block mb-1">Supervisor Email</label>
                     <input type="email" readOnly value={user?.email || ""} className="w-full glass-input opacity-70 cursor-not-allowed" />
                  </div>
               </div>
            </div>

            <div className="glass p-8">
               <h3 className="text-lg font-semibold flex items-center gap-2 mb-6"><Bell size={20} className="text-primary" /> Routing Alerts</h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/20  rounded-xl">
                     <div>
                        <p className="font-medium text-sm">Urgent Webhooks</p>
                        <p className="text-xs text-foreground/60">Immediate notification for URGENT tier issues.</p>
                     </div>
                     <input type="checkbox" defaultChecked className="toggle text-secondary" />
                  </div>
               </div>
            </div>
         </motion.div>
      </div>
    </div>
  );
}
