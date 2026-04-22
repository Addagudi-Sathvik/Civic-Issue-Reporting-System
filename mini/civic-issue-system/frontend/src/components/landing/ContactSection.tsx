"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Send } from "lucide-react";
import { useState } from "react";

export default function ContactSection() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setStatus("submitting");
    // Simulate API Call
    setTimeout(() => {
      setStatus("success");
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setStatus("idle"), 5000);
    }, 1500);
  };

  return (
    <section id="contact" className="w-full max-w-7xl mx-auto py-24 px-6 lg:px-8 relative z-10">
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: Contact Info */}
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="text-center lg:text-left"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
            Get in <span className="text-primary">Touch</span>
          </h2>
          <p className="text-lg text-slate-600 mb-10 max-w-md mx-auto lg:mx-0 font-medium">
            Have questions about the platform, facing issues, or want to give feedback? Send us a message, and our team will get back to you promptly.
          </p>

          <div className="flex flex-col gap-6 items-center lg:items-start text-left max-w-md mx-auto lg:mx-0">
             <div className="flex items-center gap-4 bg-white/60 p-4 rounded-full border border-slate-200 shadow-sm w-full">
               <div className="bg-primary/10 p-3 rounded-full text-primary">
                 <Mail size={24} />
               </div>
               <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Email Support</p>
                  <p className="text-slate-800 font-semibold">support@civicspark.gov.in</p>
               </div>
             </div>

             <div className="flex items-center gap-4 bg-white/60 p-4 rounded-full border border-slate-200 shadow-sm w-full">
               <div className="bg-secondary/10 p-3 rounded-full text-secondary">
                 <MapPin size={24} />
               </div>
               <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Headquarters</p>
                  <p className="text-slate-800 font-semibold">Secratariat Building, Hyderabad</p>
               </div>
             </div>
          </div>
        </motion.div>

        {/* Right: Contact Form */}
        <motion.div 
           initial={{ opacity: 0, x: 30 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true }}
           className="glass bg-white/80 p-8 md:p-10 rounded-3xl shadow-2xl border border-white"
        >
          {status === "success" ? (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="h-full min-h-[350px] flex flex-col items-center justify-center text-center space-y-4"
            >
               <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-4">
                  <Send size={40} className="ml-1" />
               </div>
               <h3 className="text-3xl font-bold text-slate-800">Message Sent!</h3>
               <p className="text-slate-600 font-medium">Thank you for reaching out. A representative will contact you shortly.</p>
               <button 
                  onClick={() => setStatus("idle")}
                  className="mt-6 px-6 py-2 border border-slate-300 rounded-full hover:bg-slate-50 font-semibold text-slate-600"
               >
                 Send Another
               </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="John Doe" 
                  className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  placeholder="john@example.com" 
                  className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Your Message</label>
                <textarea 
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  required
                  rows={4}
                  placeholder="How can we help?" 
                  className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={status === "submitting"}
                className={`btn-primary w-full py-4 mt-2 text-lg font-bold flex items-center justify-center gap-2 ${
                  status === "submitting" ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {status === "submitting" ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Send Message <Send size={18} /></>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
