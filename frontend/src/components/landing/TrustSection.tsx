"use client";

import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle, Activity, Award } from "lucide-react";

export default function TrustSection() {
  return (
    <section id="trust" className="w-full relative z-10 py-24 px-6 lg:px-8 bg-white/40 backdrop-blur-sm border-t border-slate-200">
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/10 blur-[120px] rounded-full opacity-50"></div>
       </div>

       <div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
          
          {/* Govt Badge / Seal Placeholder */}
          <motion.div 
             initial={{ opacity: 0, scale: 0.5 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-700 flex items-center justify-center p-1 mb-6 shadow-[0_0_40px_rgba(202,138,4,0.3)] border-4 border-white"
          >
             <div className="w-full h-full rounded-full border-2 border-yellow-200/50 flex items-center justify-center bg-white shadow-inner">
                <Award className="text-yellow-500 w-10 h-10" />
             </div>
          </motion.div>

          <motion.h2 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.1 }}
             className="text-2xl md:text-3xl font-bold text-slate-600 tracking-wide mb-2"
          >
             Powered By
          </motion.h2>
          
          <motion.h3 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.2 }}
             className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 mb-12"
          >
             CM Revanth Reddy
          </motion.h3>

          {/* Trust Indicators */}
          <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.3 }}
             className="glass bg-white/70 border border-slate-200 p-6 md:p-8 rounded-3xl w-full flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 backdrop-blur-xl shadow-xl"
          >
             <div className="flex flex-col items-center gap-3">
                <div className="bg-primary/10 p-4 rounded-full text-primary shadow-sm border border-primary/20">
                   <ShieldCheck size={32} />
                </div>
                <span className="text-slate-800 font-bold text-lg">Secure Platform</span>
             </div>

             <div className="w-full md:w-px h-px md:h-16 bg-slate-200" />

             <div className="flex flex-col items-center gap-3">
                <div className="bg-green-100 p-4 rounded-full text-green-600 shadow-sm border border-green-200">
                   <CheckCircle size={32} />
                </div>
                <span className="text-slate-800 font-bold text-lg">Verified Reports</span>
             </div>

             <div className="w-full md:w-px h-px md:h-16 bg-slate-200" />

             <div className="flex flex-col items-center gap-3">
                <div className="bg-secondary/10 p-4 rounded-full text-secondary shadow-sm border border-secondary/20">
                   <Activity size={32} />
                </div>
                <span className="text-slate-800 font-bold text-lg">Real-Time Tracking</span>
             </div>
          </motion.div>

       </div>
    </section>
  );
}
