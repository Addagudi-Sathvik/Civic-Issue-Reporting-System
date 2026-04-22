"use client";

import { motion } from "framer-motion";
import { Shield, Bell, Key, Database } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState } from "react";

export default function AdminSettings() {
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
          <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
          <p className="text-foreground/60 mt-1">Configure system-wide parameters and security.</p>
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
        <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-foreground/60 mt-1">Configure system-wide parameters and security.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="md:col-span-1 space-y-4">
            <div className="glass p-6 flex flex-col items-center text-center border border-primary/30">
               <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg">
                  <Shield size={40} />
               </div>
               <h3 className="font-bold text-xl">{user?.name || "System Admin"}</h3>
               <p className="text-foreground/60 text-sm">Root Permissions</p>
            </div>
         </motion.div>

         <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="md:col-span-2 space-y-6">
            <div className="glass p-8">
               <h3 className="text-lg font-semibold flex items-center gap-2 mb-6"><Database size={20} className="text-primary" /> System Configuration</h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/20  rounded-xl border border-white/10">
                     <div>
                        <p className="font-medium text-sm">Auto-Assign Geography</p>
                        <p className="text-xs text-foreground/60">Automatically route issues based on nearest department.</p>
                     </div>
                     <input type="checkbox" defaultChecked className="toggle" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/20  rounded-xl border border-white/10">
                     <div>
                        <p className="font-medium text-sm">Public Issue Visibility</p>
                        <p className="text-xs text-foreground/60">Allow unregistered users to view reported issues.</p>
                     </div>
                     <input type="checkbox" className="toggle" />
                  </div>
               </div>
            </div>

            <div className="glass p-8 bg-red-500/5 border border-red-500/20">
               <h3 className="text-lg font-semibold flex items-center gap-2 mb-6 text-red-500"><Key size={20} /> Danger Zone</h3>
               <p className="text-sm text-foreground/70 mb-4">Actions here can permanently alter the database state.</p>
               <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                  Purge Resolved Issues (Archive)
               </button>
            </div>
         </motion.div>
      </div>
    </div>
  );
}
