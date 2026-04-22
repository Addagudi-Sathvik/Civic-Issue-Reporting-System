"use client";

import { motion } from "framer-motion";
import { User, Bell, Shield, Key, Loader2, Check, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { AnimatePresence } from "framer-motion";

interface ToastMessage {
  type: 'success' | 'error';
  message: string;
}

export default function UserSettings() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || ""
      });
    }
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("❌ Name cannot be empty", 'error');
      return;
    }

    setLoading(true);
    try {
      // Note: API endpoint may need to be updated on backend
      await api.patch("/auth/profile", {
        name: formData.name
      });
      showToast("✅ Profile updated successfully", 'success');
      setEditMode(false);
    } catch (error: any) {
      showToast("Failed to update: " + (error.response?.data?.message || "Error"), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword.trim()) {
      showToast("❌ Current password is required", 'error');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showToast("❌ New password must be at least 6 characters", 'error');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("❌ Passwords do not match", 'error');
      return;
    }

    setLoading(true);
    try {
      // Note: API endpoint may need to be updated on backend
      await api.post("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      showToast("✅ Password changed successfully", 'success');
      setPasswordMode(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      showToast("Failed to change password: " + (error.response?.data?.message || "Error"), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while hydrating
  if (!mounted || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-foreground">User Settings</h1>
          <p className="text-foreground/60 mt-1">Manage your profile and preferences.</p>
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
        <h1 className="text-4xl font-black text-foreground">User Settings</h1>
        <p className="text-foreground/60 mt-1">Manage your profile, security, and preferences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* Profile Avatar Section */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }} 
           animate={{ opacity: 1, y: 0 }} 
           className="md:col-span-1"
         >
            <div className="glass p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center shadow-md">
               <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary text-white rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg shadow-primary/30 border-4 border-white/20">
                  <User size={40} className="text-white" />
               </div>
               <h3 className="font-bold text-xl text-foreground">{user.name || "User"}</h3>
               <p className="text-foreground/60 text-sm mt-1 font-medium">Civic Contributor</p>
               <div className="mt-4 w-full space-y-2">
                 <div className="px-3 py-2 bg-blue-500/20 text-blue-700 text-xs font-bold rounded-lg text-center border border-blue-300">
                   👤 ID: {user.id?.slice(-6).toUpperCase() || "N/A"}
                 </div>
                 <div className="px-3 py-2 bg-purple-500/20 text-purple-700 text-xs font-bold rounded-lg text-center border border-purple-300">
                   ⭐ Role: {user.role || "Citizen"}
                 </div>
               </div>
            </div>
         </motion.div>

         {/* Settings Panels */}
         <motion.div 
           initial={{ opacity: 0, x: 20 }} 
           animate={{ opacity: 1, x: 0 }} 
           className="md:col-span-2 space-y-6"
         >
            {/* Profile Information */}
            <div className="glass p-8 rounded-2xl border border-white/10 shadow-md">
               <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-foreground">
                 <Shield size={20} className="text-primary" /> Profile Information
               </h3>
               
               {editMode ? (
                 <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                       <label className="text-sm font-semibold text-foreground/80 block mb-2">Full Name</label>
                       <input 
                         type="text" 
                         value={formData.name} 
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-foreground/40"
                         placeholder="Enter your full name"
                       />
                    </div>
                    <div>
                       <label className="text-sm font-semibold text-foreground/80 block mb-2">Email Address</label>
                       <input 
                         type="email" 
                         value={formData.email}
                         readOnly
                         className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-foreground opacity-60 cursor-not-allowed"
                       />
                       <p className="text-xs text-foreground/60 mt-1">Email cannot be changed</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                       <button 
                         type="submit"
                         disabled={loading}
                         className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                         {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                         Save Changes
                       </button>
                       <button 
                         type="button"
                         onClick={() => {
                           setEditMode(false);
                           setFormData({name: user.name || "", email: user.email || ""});
                         }}
                         className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-foreground font-bold rounded-xl transition-all duration-200 border border-white/20"
                       >
                         Cancel
                       </button>
                    </div>
                 </form>
               ) : (
                 <>
                   <div className="space-y-4">
                      <div>
                         <label className="text-sm font-semibold text-foreground/80 block mb-2">Full Name</label>
                         <input 
                           type="text" 
                           readOnly 
                           value={formData.name} 
                           className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-foreground opacity-70 cursor-not-allowed"
                         />
                      </div>
                      <div>
                         <label className="text-sm font-semibold text-foreground/80 block mb-2">Email Address</label>
                         <input 
                           type="email" 
                           readOnly 
                           value={formData.email}
                           className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-foreground opacity-70 cursor-not-allowed"
                         />
                      </div>
                   </div>
                   <button 
                     onClick={() => setEditMode(true)}
                     className="mt-4 w-full px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl transition-all duration-200 border border-primary/30"
                   >
                     Edit Profile
                   </button>
                 </>
               )}
            </div>

            {/* Account Security */}
            <div className="glass p-8 rounded-2xl border border-white/10 shadow-md">
               <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-foreground">
                 <Key size={20} className="text-primary" /> Account Security
               </h3>

               {passwordMode ? (
                 <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                       <label className="text-sm font-semibold text-foreground/80 block mb-2">Current Password</label>
                       <input 
                         type="password" 
                         value={passwordData.currentPassword}
                         onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                         className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-foreground/40"
                         placeholder="Enter current password"
                       />
                    </div>
                    <div>
                       <label className="text-sm font-semibold text-foreground/80 block mb-2">New Password</label>
                       <input 
                         type="password" 
                         value={passwordData.newPassword}
                         onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                         className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-foreground/40"
                         placeholder="Enter new password (min 6 characters)"
                       />
                    </div>
                    <div>
                       <label className="text-sm font-semibold text-foreground/80 block mb-2">Confirm Password</label>
                       <input 
                         type="password" 
                         value={passwordData.confirmPassword}
                         onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                         className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-foreground/40"
                         placeholder="Confirm new password"
                       />
                    </div>
                    <div className="flex gap-3 pt-2">
                       <button 
                         type="submit"
                         disabled={loading}
                         className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                         {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                         Change Password
                       </button>
                       <button 
                         type="button"
                         onClick={() => {
                           setPasswordMode(false);
                           setPasswordData({currentPassword: "", newPassword: "", confirmPassword: ""});
                         }}
                         className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-foreground font-bold rounded-xl transition-all duration-200 border border-white/20"
                       >
                         Cancel
                       </button>
                    </div>
                 </form>
               ) : (
                 <button 
                   onClick={() => setPasswordMode(true)}
                   className="w-full px-4 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-200 font-bold text-foreground flex items-center justify-between"
                 >
                   <span>Change Password</span>
                   <Key size={18} />
                 </button>
               )}
            </div>

            {/* Notifications */}
            <div className="glass p-8 rounded-2xl border border-white/10 shadow-md">
               <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-foreground">
                 <Bell size={20} className="text-primary" /> Notifications
               </h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-200">
                     <div>
                        <p className="font-semibold text-foreground">Email Alerts</p>
                        <p className="text-xs text-foreground/60 mt-1">Get notified when your issue status changes</p>
                     </div>
                     <label className="relative inline-block w-12 h-6 cursor-pointer">
                       <input 
                         type="checkbox" 
                         checked={emailNotifications}
                         onChange={(e) => setEmailNotifications(e.target.checked)}
                         className="hidden"
                       />
                       <div className={`absolute rounded-full transition-all duration-300 ${emailNotifications ? 'bg-primary' : 'bg-gray-400'} w-12 h-6`}></div>
                       <div className={`absolute rounded-full w-5 h-5 bg-white transition-all duration-300 ${emailNotifications ? 'translate-x-6' : 'translate-x-0.5'} top-0.5 left-0.5`}></div>
                     </label>
                  </div>
               </div>
            </div>
         </motion.div>
      </div>

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
