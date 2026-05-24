"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";
import api from "@/lib/api";

import MapComponent from "@/components/report/MapComponent";
import AIValidation from "@/components/report/AIValidation";
import NearbyIssues from "@/components/report/NearbyIssues";

export default function ReportIssue() {
  const router = useRouter();

  // Form State
  const [category, setCategory] = useState("ROADS");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState({ lat: 17.3850, lng: 78.4867, address: "Hyderabad (Default)" });

  // Flow State
  const [step, setStep] = useState(1); // 1: Image & Category, 2: Map & Nearby, 3: Final Details
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const handleValidationSuccess = (uploadedFile: File) => {
    setFile(uploadedFile);
    setTimeout(() => {
        setStep(2);
    }, 1500); // give time to show success tick
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setLocation({ lat, lng, address });
  };

  const submitNewIssue = async () => {
    if (!title || !description || !file) {
      setError("Please fill out all required fields and ensure image is uploaded.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("location", JSON.stringify(location));
      formData.append("media", file);

      await api.post("/issues", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setPointsEarned(60); // 10 base + 50 new bonus
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReposted = () => {
     setPointsEarned(5);
     setSuccess(true);
     setTimeout(() => router.push("/dashboard"), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Smart Issue Reporting</h1>
        <p className="text-slate-600 mt-1 font-medium">Earn points for keeping the city smart. Powered by AI and real-time mapping.</p>
      </header>

      {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center gap-3 shadow-sm">
            <AlertCircle size={20} className="shrink-0" />
            <span className="font-bold">{error}</span>
          </motion.div>
      )}

      {success && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-6 p-6 rounded-2xl bg-green-50 border border-green-200 text-green-700 flex items-center gap-4 shadow-sm shadow-green-100">
            <CheckCircle size={32} className="shrink-0 text-green-500" />
            <div>
               <h3 className="font-extrabold text-xl">Success!</h3>
               <p className="font-medium">Action recorded successfully. You&apos;ve earned <span className="font-extrabold text-green-600">+{pointsEarned} Points</span>! Redirecting to dashboard...</p>
            </div>
          </motion.div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: Map Selection (Sticky) */}
        <div className="w-full lg:w-5/12 glass p-4 rounded-3xl sticky top-24 shadow-lg border border-white/50">
           <MapComponent onLocationSelect={handleLocationSelect} />
           <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Selected Location</span>
              <span className="block font-medium text-slate-800">{location.address}</span>
           </div>
        </div>

        {/* Right Side: Smart Flow */}
        <div className="w-full lg:w-7/12 flex flex-col gap-6">
           
           {/* Step 1: Category & AI Validation */}
           <div className="glass p-8 rounded-3xl shrink-0 shadow-lg border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">1</div>
                 <h2 className="text-2xl font-bold text-slate-800">Identify & Upload</h2>
              </div>
              
              <div className="mb-6">
                <label className="text-sm font-bold text-slate-700 mb-2 block">Select Category</label>
                <select 
                   value={category} 
                   onChange={(e) => setCategory(e.target.value)} 
                   disabled={step > 1}
                   className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none font-medium"
                >
                   <option value="ROADS" className="text-black">Roads & Transport</option>
                   <option value="WATER" className="text-black">Water Management</option>
                   <option value="GARBAGE" className="text-black">Waste & Garbage</option>
                   <option value="ELECTRICITY" className="text-black">Electricity</option>
                   <option value="OTHER" className="text-black">Other</option>
                </select>
              </div>

              {!file ? (
                 <AIValidation 
                    category={category} 
                    onValidationSuccess={handleValidationSuccess}
                    onValidationFail={() => setStep(1)}
                 />
              ) : (
                 <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 font-bold">
                    <CheckCircle size={20} /> Image Validated via AI
                 </div>
              )}
           </div>

           {/* Step 2: Nearby Search */}
           {step >= 2 && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl shrink-0 shadow-lg border border-white/50">
                <div className="flex items-center gap-3 mb-6">
                 <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">2</div>
                 <h2 className="text-2xl font-bold text-slate-800">Nearby Scan</h2>
                </div>
                
                <NearbyIssues lat={location.lat} lng={location.lng} category={category} onReposted={handleReposted} />

                {step === 2 && (
                  <button 
                     onClick={() => setStep(3)}
                     className="w-full mt-6 py-4 bg-white border border-slate-200 text-slate-700 hover:border-primary hover:text-primary font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                     None of these match. Proceed to Create <ChevronRight size={18} />
                  </button>
                )}
             </motion.div>
           )}

           {/* Step 3: Final Details */}
           {step >= 3 && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl shrink-0 shadow-lg border border-primary/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-md">3</div>
                    <h2 className="text-2xl font-bold text-slate-800">Final Details</h2>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="text-sm font-bold text-slate-700 mb-2 block">Issue Title</label>
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E.g. Large Pothole on Main St" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700 mb-2 block">Detailed Description</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe the severity and exactly where it is..." className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" />
                    </div>
                  </div>

                  <button 
                     onClick={submitNewIssue} 
                     disabled={loading || success} 
                     className="w-full mt-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-extrabold text-lg rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {loading ? "Creating Smart Record..." : <>Submit Unique Report <Send size={20} /></>}
                  </button>
                </div>
             </motion.div>
           )}

        </div>
      </div>
    </div>
  );
}
