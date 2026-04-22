"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ImageIcon, MapPin, MessageSquareWarning } from "lucide-react";

const rules = [
  {
    icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
    title: "No Fake Reports",
    description: "Maximum of 3 fake or misleading reports allowed. After 3 violations, the account will be permanently disabled.",
    isStrict: true,
  },
  {
    icon: <ImageIcon className="w-8 h-8 text-primary" />,
    title: "Upload Clear Evidence",
    description: "All submissions must include clear, well-lit, and relevant images of the issue.",
    isStrict: false,
  },
  {
    icon: <MapPin className="w-8 h-8 text-secondary" />,
    title: "Accurate Location Required",
    description: "Ensure GPS coordinates and physical address details match the exact location of the problem.",
    isStrict: false,
  },
  {
    icon: <MessageSquareWarning className="w-8 h-8 text-indigo-500" />,
    title: "Respect Guidelines",
    description: "No abusive language, irrelevant content, or spamming submissions.",
    isStrict: false,
  }
];

export default function RegulationsSection() {
  return (
    <section id="regulations" className="w-full max-w-7xl mx-auto py-24 px-6 lg:px-8 relative z-10">
      <div className="text-center mb-16">
        <motion.h2 
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4"
        >
          Community <span className="text-primary">Regulations</span>
        </motion.h2>
        <motion.p 
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.1 }}
           className="text-lg text-slate-600 max-w-2xl mx-auto"
        >
          To maintain a reliable platform, please adhere exactly to these straightforward guidelines when submitting an issue.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {rules.map((rule, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className={`glass p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl relative overflow-hidden flex flex-col items-start gap-4 bg-white/70 ${
              rule.isStrict ? "border-2 border-red-400/50 hover:border-red-500" : "border border-slate-200"
            }`}
          >
            {rule.isStrict && (
              <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-bl-xl border-b border-l border-red-200 flex items-center gap-1">
                <AlertTriangle size={12} /> STRICT
              </div>
            )}
            
            <div className={`p-4 rounded-2xl ${rule.isStrict ? 'bg-red-50' : 'bg-slate-50'}`}>
              {rule.icon}
            </div>
            
            <h3 className={`text-xl font-bold ${rule.isStrict ? 'text-red-600' : 'text-slate-800'}`}>
              {rule.title}
            </h3>
            
            <p className="text-slate-600 font-medium text-sm leading-relaxed">
              {rule.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
