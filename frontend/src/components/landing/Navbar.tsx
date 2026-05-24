"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Map, Menu, X, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import clsx from "clsx";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Handle scroll state for sticky nav styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = ["home", "regulations", "about", "contact", "trust"];
      let currentSection = "home";

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            currentSection = section;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#home", id: "home" },
    { name: "Regulations", href: "#regulations", id: "regulations" },
    { name: "About Us", href: "#about", id: "about" },
    { name: "Contact Us", href: "#contact", id: "contact" },
    { name: "Trust", href: "#trust", id: "trust" },
  ];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
       targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 inset-x-0 w-full z-50 px-4 pt-6 pb-2 transition-all duration-500"
    >
      <div 
        className={clsx(
          "mx-auto flex h-16 max-w-6xl items-center justify-between px-6 transition-all duration-500 ease-in-out rounded-2xl",
          isScrolled 
            ? "bg-white/30 backdrop-blur-2xl border border-white/50 shadow-[0_8px_40px_rgba(0,0,0,0.08)]" 
            : "bg-white/20 backdrop-blur-xl border border-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
        )}
      >
        
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link 
            href="#home" 
            onClick={(e) => handleSmoothScroll(e, '#home')} 
            className="flex items-center gap-2 relative z-50 group"
          >
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.7)] transition-all duration-300"
              whileHover={{ rotate: 15 }}
            >
              <Map size={20} />
            </motion.div>
            <span className="font-extrabold text-xl tracking-tight text-slate-800 hidden sm:inline">
              Civic<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Spark</span>
            </span>
          </Link>
        </motion.div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link, idx) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <a
                href={link.href}
                onClick={(e) => handleSmoothScroll(e, link.href)}
                className={clsx(
                  "relative px-5 py-2 text-sm font-bold transition-all duration-300 ease-in-out z-10 rounded-xl",
                  activeSection === link.id 
                    ? "text-blue-700" 
                    : "text-slate-600 hover:text-slate-800 hover:bg-white/30"
                )}
              >
                {link.name}
                
                {/* Glowing Pill active indicator */}
                {activeSection === link.id && (
                  <motion.div
                    layoutId="activeNavBackground"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 border border-blue-300/40 shadow-[0_0_20px_rgba(59,130,246,0.2)] -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </a>
            </motion.div>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/auth/login">
              <button className="px-6 py-2.5 text-sm font-bold text-slate-700 hover:text-slate-900 border border-white/40 hover:border-white/60 rounded-xl transition-all duration-300 bg-white/10 hover:bg-white/30 backdrop-blur-sm">
                Sign In
              </button>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/auth/register">
              <button className="px-6 py-2.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.7)] hover:shadow-purple-500/50 hover:translate-y-[-2px] transition-all duration-300 border border-purple-400/30 flex items-center gap-2">
                Get Started
                <ArrowRight size={16} />
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="lg:hidden flex items-center gap-4 relative z-50">
           <motion.button 
             whileTap={{ scale: 0.9 }}
             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
             className="text-slate-800 p-2 focus:outline-none hover:bg-white/30 rounded-lg transition-all duration-300"
           >
             {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
           </motion.button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 10, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden absolute top-full left-4 right-4 mt-2 bg-white/40 backdrop-blur-3xl border border-white/60 shadow-[0_15px_50px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden p-3"
          >
            <div className="flex flex-col gap-1 p-2">
              {navLinks.map((link, idx) => (
                <motion.a
                  key={link.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  href={link.href}
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                  className={clsx(
                    "px-5 py-3 text-base font-bold rounded-xl transition-all duration-300",
                    activeSection === link.id 
                      ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-blue-700 shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-blue-300/50" 
                      : "text-slate-700 hover:bg-white/40 border border-white/20"
                  )}
                >
                  {link.name}
                </motion.a>
              ))}
              <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-white/30">
                <Link href="/auth/login" className="w-full">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    className="w-full text-center px-6 py-3 font-bold text-slate-700 bg-white/30 hover:bg-white/50 border border-white/40 rounded-xl transition-all duration-300"
                  >
                    Sign In
                  </motion.button>
                </Link>
                <Link href="/auth/register" className="w-full">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    className="w-full text-center px-6 py-3 font-bold text-white rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.7)] transition-all duration-300"
                  >
                    Create Account
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
