"use client";

import { motion } from "framer-motion";
import { Users, Building2, AlertCircle } from "lucide-react";

export default function DepartmentsPage() {
  const departments = [
    { name: "Roads & Transport", role: "ROADS", issuesSub: 45 },
    { name: "Water Supply", role: "WATER", issuesSub: 32 },
    { name: "Waste Management", role: "GARBAGE", issuesSub: 78 },
    { name: "Electricity grid", role: "ELECTRICITY", issuesSub: 15 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Users className="text-primary" size={32} />
          Department Management
        </h1>
        <p className="text-foreground/60 mt-1">Manage civic utility departments and their active assignments.</p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6"
      >
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-foreground">Registered Departments</h2>
           <button className="px-4 py-2 bg-primary/20 text-primary font-semibold rounded-lg text-sm hover:bg-primary/30 transition-all opacity-50 cursor-not-allowed">
              + Add Department
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {departments.map((dep, i) => (
             <div key={i} className="p-5 border border-white/10 bg-primary/5  rounded-xl hover:bg-white/10 transition-colors">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Building2 size={24} />
                 </div>
                 <div>
                   <h3 className="font-bold text-foreground">{dep.name}</h3>
                   <span className="text-xs text-foreground/50 font-mono">{dep.role}</span>
                 </div>
               </div>
               
               <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                 <span className="text-sm text-foreground/70">Assigned Issues:</span>
                 <span className="font-bold text-foreground">{dep.issuesSub}</span>
               </div>
             </div>
           ))}
        </div>
        
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3 text-blue-600 dark:text-blue-400 text-sm">
           <AlertCircle className="shrink-0" size={20} />
           <p>Department accounts act as administrative agents. To deploy a new department system, use the registration flow programmatically with the DEPARTMENT role assigned.</p>
        </div>

      </motion.div>
    </div>
  );
}
