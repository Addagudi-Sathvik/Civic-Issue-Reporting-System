"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, MapPin, Building2, CheckCircle2, Clock } from "lucide-react";
import { useState, useEffect } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.2, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function HeroSection({ mousePosition }: { mousePosition: { x: number, y: number } }) {
  return (
    <div id="home" className="flex flex-col lg:flex-row items-center justify-between w-full max-w-7xl pt-32 lg:pt-40 z-10 gap-16 relative">
      {/* Left: Copy & CTAs */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="flex-1 text-center lg:text-left"
      >
        <motion.div variants={itemVariants} className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-white/80 backdrop-blur-md text-primary font-bold text-sm mb-6 shadow-sm">
           📍 The Future of Urban Tracking
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
          Civic Issue <br className="hidden lg:block"/>
          <span className="text-gradient">Reporting</span> System
        </motion.h1>
        
        <motion.p variants={itemVariants} className="text-lg lg:text-xl text-slate-600 mb-10 max-w-2xl font-medium leading-relaxed">
          Your city, your voice — report issues and track real-time solutions effortlessly.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
          <Link href="/auth/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary px-8 py-4 flex items-center justify-center gap-2 group w-full sm:w-auto text-lg hover:shadow-[0_0_25px_rgba(2,132,199,0.4)]"
            >
              Get Started 
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
          <Link href="/auth/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 flex items-center justify-center bg-white/80 backdrop-blur-md border border-slate-300 text-slate-800 font-bold rounded-xl hover:bg-white hover:shadow-lg transition-all w-full sm:w-auto text-lg"
            >
              Create Account
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Right: Graphic/Lottie - Interactive Parallax Frame */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
        whileInView={{ opacity: 1, scale: 1, rotateY: mousePosition.x * 0.5, rotateX: mousePosition.y * -0.5 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        style={{ perspective: 1000 }}
        className="flex-1 w-full max-w-lg relative mt-12 lg:mt-0"
      >
        {/* Soft shadow framing */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-[3rem] blur-2xl transform rotate-3 scale-105 pointer-events-none"></div>
        <div className="glass p-2 rounded-[3rem] shadow-2xl relative bg-white/40 transform -rotate-1 transition-transform hover:rotate-0 duration-500">
           <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-4 h-[400px] flex flex-col items-center justify-center overflow-hidden relative shadow-inner">
              <HeroAnimationFlow />
           </div>
        </div>
      </motion.div>
    </div>
  );
}

function HeroAnimationFlow() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4); 
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 relative font-sans">
      <motion.div 
        animate={{ scale: step > 0 ? 0.9 : 1, y: step > 1 ? -20 : 0 }} 
        className="w-full h-48 rounded-2xl relative overflow-hidden shadow-inner border border-slate-300 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-map-bg.png')" }}
      >
         <AnimatePresence>
            {step >= 1 && (
               <motion.div 
                 initial={{ y: -50, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ opacity: 0, scale: 0 }}
                 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 drop-shadow-md z-10"
               >
                 <MapPin fill="currentColor" className="text-white" size={40} />
                 <motion.div 
                   animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }} 
                   transition={{ repeat: Infinity, duration: 1.5 }}
                   className="absolute -bottom-1 left-3 w-4 h-4 bg-red-400 rounded-full blur-[2px] -z-10"
                 />
               </motion.div>
            )}
         </AnimatePresence>
      </motion.div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ opacity: step >= 2 ? 1 : 0 }}>
         <motion.path 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: step >= 2 ? 1 : 0 }}
            transition={{ duration: 1 }}
            d="M 50% 45% C 50% 60%, 50% 70%, 50% 85%" 
            stroke="#0284C7" strokeWidth="3" fill="none" strokeDasharray="5 5"
            className="animate-pulse"
         />
      </svg>

      <motion.div 
         initial={{ y: 50, opacity: 0 }}
         animate={{ y: step >= 2 ? 0 : 50, opacity: step >= 2 ? 1 : 0 }}
         className="w-full mt-6 bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center justify-between z-20"
      >
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
               <Building2 size={20} />
            </div>
            <div className="flex flex-col text-left">
               <span className="text-sm font-bold text-slate-800">Department Sync</span>
               <span className="text-xs text-slate-500">Issue ID: #C902</span>
            </div>
         </div>
         
         <motion.div 
            key={step === 3 ? 'resolved' : 'pending'}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
               step === 3 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
            }`}
         >
            {step === 3 ? (
               <><CheckCircle2 size={14} /> Resolved</>
            ) : (
               <><Clock size={14} /> Pending</>
            )}
         </motion.div>
      </motion.div>
    </div>
  );
}
