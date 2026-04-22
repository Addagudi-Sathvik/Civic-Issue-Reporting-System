"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Lock, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const response = await api.post("/auth/login", { email, password });
      login(response.data.user, response.data.token);
      
      // Redirect based on role
      const role = response.data.user.role;
      if (role === "ADMIN") router.push("/admin");
      else if (role === "DEPARTMENT") router.push("/department");
      else router.push("/dashboard");
      
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
       {/* Background Elements */}
       <div className="absolute top-[10%] right-[10%] w-96 h-96 bg-primary-light/50 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
       <div className="absolute bottom-[10%] left-[10%] w-80 h-80 bg-secondary-light/50 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10 glass p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-foreground/60 mt-2">Sign in to your account to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-500 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
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

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 btn-primary text-white font-semibold flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading ? "Signing in..." : <>Sign In <ArrowRight size={18} /></>}
          </motion.button>
        </form>

        <p className="text-center mt-8 text-foreground/70 text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-primary font-bold hover:underline">
            Register here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
