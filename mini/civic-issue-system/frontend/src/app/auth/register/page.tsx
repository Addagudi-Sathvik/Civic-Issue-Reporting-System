"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Lock, User, Briefcase, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER"); // USER, DEPARTMENT, ADMIN
  const [departmentType, setDepartmentType] = useState("ROADS");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        password,
        role,
        ...(role === "DEPARTMENT" && { departmentType }),
      };

      const response = await api.post("/auth/register", payload);
      login(response.data.user, response.data.token);
      
      if (role === "ADMIN") router.push("/admin");
      else if (role === "DEPARTMENT") router.push("/department");
      else router.push("/dashboard");

    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
       {/* Background Elements */}
       <div className="absolute top-[20%] left-[5%] w-96 h-96 bg-secondary-light/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
       <div className="absolute bottom-[5%] right-[15%] w-[400px] h-[400px] bg-primary-light/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10 glass p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="text-foreground/60 mt-2">Join us to make your city better</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-500 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full glass-input pl-12 py-3"
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full glass-input pl-12 py-3"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full glass-input pl-12 py-3"
              required
            />
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm text-foreground/80 font-medium">I am a:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("USER")}
                className={`py-2 rounded-xl border transition-all ${role === "USER" ? "bg-primary text-white border-primary shadow-md" : "bg-white/20 border-white/20 text-foreground hover:bg-white/40"}`}
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => setRole("DEPARTMENT")}
                className={`py-2 rounded-xl border transition-all flex items-center justify-center gap-2 ${role === "DEPARTMENT" ? "bg-primary text-white border-primary shadow-md" : "bg-white/20 border-white/20 text-foreground hover:bg-white/40"}`}
              >
                 Department
              </button>
            </div>
          </div>

          {role === "DEPARTMENT" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
               <label className="text-sm text-foreground/80 font-medium mb-1 block">Department Type:</label>
               <div className="relative">
                 <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
                 <select
                    value={departmentType}
                    onChange={(e) => setDepartmentType(e.target.value)}
                    className="w-full glass-input pl-12 py-3 appearance-none cursor-pointer"
                 >
                   <option value="ROADS" className="text-black">Roads & Transport</option>
                   <option value="WATER" className="text-black">Water Management</option>
                   <option value="GARBAGE" className="text-black">Waste & Garbage</option>
                   <option value="ELECTRICITY" className="text-black">Electricity</option>
                   <option value="OTHER" className="text-black">Other</option>
                 </select>
               </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 btn-primary text-white font-semibold flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading ? "Creating..." : <>Create Account <ArrowRight size={18} /></>}
          </motion.button>
        </form>

        <p className="text-center mt-6 text-foreground/70 text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
