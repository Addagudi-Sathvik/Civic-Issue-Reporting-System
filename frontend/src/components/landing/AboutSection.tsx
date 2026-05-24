"use client";

import { motion } from "framer-motion";
import { Users, Target, ShieldCheck, Gift, Star } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="w-full max-w-7xl mx-auto py-24 px-6 lg:px-8 relative z-10">
      <div className="flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left Side: Illustration / Gamification Details */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex-1 w-full relative"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-[3rem] blur-3xl -z-10"></div>
          <div className="glass p-8 rounded-[2rem] bg-white/60 border border-white/60 shadow-xl relative flex flex-col gap-6">
            <h3 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
               <span className="p-3 bg-yellow-100 rounded-xl text-yellow-600"><Star size={24} /></span>
               Gamified Reporting Rewards
            </h3>
            <p className="text-slate-600 font-medium">Keep our city clean and earn redeemable points for being an active, responsible citizen!</p>
            
            <div className="flex flex-col gap-4">
               <div className="p-4 bg-white/80 border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                  <span className="font-bold text-slate-700">Submit a New Issue</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 font-extrabold rounded-lg">+10 Points</span>
               </div>
               <div className="p-4 bg-white/80 border border-slate-200 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-xl z-0" />
                  <span className="font-bold text-slate-700 z-10 ml-2">First-to-Report Bonus</span>
                  <span className="px-3 py-1 bg-secondary/10 text-secondary font-extrabold rounded-lg z-10">+50 Points</span>
               </div>
               <div className="p-4 bg-white/80 border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                  <span className="font-bold text-slate-700">Repost / Support Issue</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 font-extrabold rounded-lg">+5 Points</span>
               </div>
            </div>

            <div className="mt-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 flex items-start gap-4">
               <Gift className="text-primary shrink-0 mt-0.5" />
               <p className="text-sm font-medium text-slate-700"><span className="font-bold text-slate-900">Future Perks:</span> Accumulate points to unlock special Government-issued coupons and city transport discounts.</p>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Text & Cards */}
        <div className="flex-1 text-center lg:text-left">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-extrabold text-slate-900 mb-6"
          >
            Empowering Citizens, <br/> <span className="text-secondary">Transforming Cities.</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 mb-10 leading-relaxed font-medium"
          >
            CivicSpark is a modern platform bridging the gap between urban residents and municipal departments. Integrating AI object-validation and Geospatial awareness to ensure every reported civic issue is mapped accurately and resolved swiftly.
          </motion.p>

          <div className="flex flex-col gap-4">
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.2 }}
               className="glass p-6 rounded-2xl bg-white/70 border border-slate-200 flex gap-4 items-start card-hover"
            >
              <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0"><Target size={24} /></div>
              <div>
                <h4 className="text-xl font-bold text-slate-800 mb-1">Our Mission</h4>
                <p className="text-slate-600 text-sm font-medium">To provide a robust, transparent, and swift digital pipeline for reporting addressing civic anomalies on an open scale.</p>
              </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.3 }}
               className="glass p-6 rounded-2xl bg-white/70 border border-slate-200 flex gap-4 items-start card-hover"
            >
              <div className="p-3 bg-secondary/10 text-secondary rounded-xl shrink-0"><Users size={24} /></div>
              <div>
                <h4 className="text-xl font-bold text-slate-800 mb-1">Our Vision</h4>
                <p className="text-slate-600 text-sm font-medium">Creating sustainable, smart, and interactive cities where the voice of the community continuously refines the administration.</p>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
}
