"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import RegulationsSection from "@/components/landing/RegulationsSection";
import AboutSection from "@/components/landing/AboutSection";
import ContactSection from "@/components/landing/ContactSection";
import TrustSection from "@/components/landing/TrustSection";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20; 
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center relative bg-[#F8FAFC]">
      
      {/* 
        RICH ANIMATED BACKGROUND LAYER 
        Contains Parallax, Pulsing Pins, Data Lines, and Heatwaves 
      */}
      <motion.div 
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        animate={{
          x: mousePosition.x * -1.5,
          y: mousePosition.y * -1.5,
          scale: 1.02 // Very slow zoom/pan scale as requested
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      >
        {/* Animated Smart City Building Background */}
        <div 
           className="absolute inset-x-[-10%] inset-y-[-10%] w-[120%] h-[120%] opacity-30 z-0"
           style={{
             backgroundImage: "url('/smart-city-main.png')",
             backgroundSize: "cover",
             backgroundPosition: "center",
             WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,1) 20%, rgba(0,0,0,0.1) 100%)"
           }}
        ></div>

        {/* Heatmap blur zones */}
        <div className="absolute top-[10%] left-[15%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulseMap animation-delay-2000"></div>
        <div className="absolute bottom-[10%] right-[15%] w-80 h-80 bg-secondary/10 rounded-full blur-[100px] animate-pulseMap"></div>

        {/* Connecting Data Network SVG */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          {/* Main Artery */}
          <motion.path 
            initial={{ pathLength: 0 }} 
            animate={{ pathLength: 1 }} 
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            d="M 10% 20% Q 30% 10% 40% 40% T 70% 80%" 
            stroke="#0284C7" strokeWidth="2" fill="none" strokeDasharray="15 15"
          />
          {/* Secondary Artery */}
          <motion.path 
            initial={{ pathLength: 0 }} 
            animate={{ pathLength: 1 }} 
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
            d="M 80% 20% Q 60% 30% 50% 60% T 20% 80%" 
            stroke="#8B5CF6" strokeWidth="1.5" fill="none" strokeDasharray="10 10"
          />
          <motion.path 
            initial={{ pathLength: 0 }} 
            animate={{ pathLength: 1 }} 
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            d="M 50% 10% L 50% 90%" 
            stroke="#16A34A" strokeWidth="1" fill="none" strokeDasharray="5 15"
          />
        </svg>

        {/* Pulsing GPS Location Pins representing Active Issues */}
        <div className="absolute top-[20%] left-[10%] flex items-center justify-center">
            <div className="w-4 h-4 bg-secondary rounded-full shadow-glowSec absolute"></div>
            <div className="w-12 h-12 border border-secondary/50 rounded-full animate-ping absolute"></div>
        </div>
        
        <div className="absolute top-[60%] left-[25%] flex items-center justify-center animation-delay-2000">
            <div className="w-3 h-3 bg-primary rounded-full shadow-glow absolute"></div>
            <div className="w-8 h-8 border border-primary/50 rounded-full animate-ping absolute"></div>
        </div>

        <div className="absolute bottom-[20%] right-[10%] flex items-center justify-center animation-delay-4000">
            <div className="w-6 h-6 bg-red-400 rounded-full drop-shadow-[0_0_10px_rgba(248,113,113,0.8)] absolute"></div>
            <div className="w-16 h-16 border border-red-400/50 rounded-full animate-ping absolute"></div>
        </div>

        <div className="absolute top-[30%] right-[20%] flex items-center justify-center">
            <div className="w-4 h-4 bg-green-400 rounded-full drop-shadow-[0_0_10px_rgba(74,222,128,0.8)] absolute"></div>
            <div className="w-10 h-10 border border-green-400/50 rounded-full animate-ping absolute"></div>
        </div>

        {/* Floating Particles mimicking digital traffic */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-primary/40 rounded-full shadow-glow"
            style={{
               top: `${Math.random() * 100}%`,
               left: `${Math.random() * 100}%`
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
      {/* 
        END BACKGROUND ANIMATION LAYER 
      */}

      {/* Structured Gradient Overlay to ensure foreground text is pin-sharp */}
      <div className="fixed inset-0 bg-gradient-to-b from-white/30 via-white/50 to-white/95 pointer-events-none z-0"></div>

      {/* 1. Global Navbar */}
      <Navbar />

      {/* 2. Hero Section */}
      <HeroSection mousePosition={mousePosition} />

      {/* 3. Regulations Section */}
      <RegulationsSection />

      {/* 4. About Us Section */}
      <AboutSection />

      {/* 5. Contact Us Section */}
      <ContactSection />

      {/* 6. Trust Section */}
      <TrustSection />

    </main>
  );
}
