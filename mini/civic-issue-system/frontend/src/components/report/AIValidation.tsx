"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle2, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AIValidationProps {
  category: string;
  onValidationSuccess: (file: File) => void;
  onValidationFail: () => void;
}

interface ValidationData {
  valid: boolean;
  category: string;
  confidence: number;
  objects_detected: string[];
  message: string;
}

export default function AIValidation({ category, onValidationSuccess, onValidationFail }: AIValidationProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "validating" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [validationData, setValidationData] = useState<ValidationData | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrorMsg("❌ File too large. Max 5MB allowed.");
        setStatus("error");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      validateImage(selectedFile);
    }
  };

  const validateImage = (selectedFile: File) => {
    if (!category) {
       setStatus("error");
       setErrorMsg("❌ Please select a category first.");
       onValidationFail();
       return;
    }

    setStatus("validating");
    
    const formData = new FormData();
    formData.append("media", selectedFile);
    formData.append("category", category);

    const headers: Record<string, string> = {};
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    fetch("http://localhost:5000/api/issues/validate-image", {
      method: "POST",
      headers,
      body: formData,
    })
    .then(async (res) => {
        const data = await res.json();
        return { ok: res.ok, data };
    })
    .then(({ ok, data }) => {
        setValidationData(data);
        if (ok && data.valid) {
            setStatus("success");
            onValidationSuccess(selectedFile);
        } else {
            setStatus("error");
            setErrorMsg(data.message || "Validation failed");
            onValidationFail();
        }
    })
    .catch((err: any) => {
        setStatus("error");
        const message = err?.message === "Failed to fetch"
          ? "❌ Cannot reach validation server. Ensure backend is running on http://localhost:5000"
          : err?.message || "❌ AI Validation failed. Please try again.";
        setErrorMsg(message);
        onValidationFail();
    });
  };

  const handleReset = () => {
    setPreview(null);
    setFile(null);
    setStatus("idle");
    setErrorMsg("");
    setValidationData(null);
  };

  return (
    <div className="w-full">
      {!preview ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative glass border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
        >
          <input 
            type="file" 
            accept="image/*" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleUpload}
          />
          <motion.div 
            className="bg-primary/10 p-4 rounded-full text-primary mb-4 shadow-sm group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300"
            whileHover={{ scale: 1.1 }}
          >
             <UploadCloud size={32} />
          </motion.div>
          <h3 className="text-lg font-bold text-slate-800">Upload Image Proof</h3>
          <p className="text-sm font-medium text-slate-500 mt-1 max-w-xs">
             AI will verify the image matches your selected category
          </p>
          <p className="text-xs text-slate-400 mt-2">Max 5MB • JPG, PNG supported</p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4">
           <div className="relative w-full h-48 rounded-2xl overflow-hidden glass shadow-md border border-slate-200">
             <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
             
             {/* Validating Overlay */}
             <AnimatePresence>
               {status === "validating" && (
                 <motion.div 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }} 
                   exit={{ opacity: 0 }}
                   className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center text-white"
                 >
                   <Loader2 size={40} className="animate-spin mb-3 text-blue-400" />
                   <div className="text-center">
                     <p className="font-bold tracking-wide">Validating Image...</p>
                     <p className="text-xs text-slate-300 mt-1">Analyzing with AI vision</p>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>

           {/* Success State */}
           {status === "success" && validationData && (
              <motion.div 
                initial={{ y: -10, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-300 rounded-xl shadow-md"
              >
                 <div className="flex items-start gap-3">
                   <CheckCircle2 size={22} className="shrink-0 text-green-600 mt-0.5" />
                   <div className="flex-1">
                     <p className="font-bold text-green-800">✅ Validation Successful!</p>
                     <p className="text-sm text-green-700 mt-1">{validationData.message}</p>
                   </div>
                 </div>
                 <div className="flex gap-4 text-sm">
                   <div className="flex-1">
                     <span className="font-semibold text-green-800">Category</span>
                     <p className="text-green-700 font-mono">{validationData.category}</p>
                   </div>
                   <div className="flex-1">
                     <span className="font-semibold text-green-800">Confidence</span>
                     <div className="flex items-center gap-2 mt-1">
                       <div className="flex-1 h-2 bg-green-200 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                           style={{ width: `${validationData.confidence}%` }}
                         />
                       </div>
                       <span className="font-mono text-green-700 font-bold">{validationData.confidence}%</span>
                     </div>
                   </div>
                 </div>
                 {validationData.objects_detected && validationData.objects_detected.length > 0 && (
                   <div className="text-sm">
                     <span className="font-semibold text-green-800">Objects Detected</span>
                     <div className="flex flex-wrap gap-2 mt-2">
                       {validationData.objects_detected.map((obj, i) => (
                         <span key={i} className="px-2 py-1 bg-green-200 text-green-800 text-xs font-bold rounded-full">
                           {obj}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}
              </motion.div>
           )}

           {/* Error State */}
           {status === "error" && (
              <motion.div 
                initial={{ y: -10, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col gap-3 p-4 bg-gradient-to-br from-red-50 to-rose-50 border border-red-300 rounded-xl shadow-md"
              >
                 <div className="flex items-start gap-3">
                   <AlertTriangle size={22} className="shrink-0 text-red-600 mt-0.5" />
                   <div className="flex-1">
                     <p className="font-bold text-red-800">Validation Failed</p>
                     <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
                   </div>
                 </div>
                 {validationData && (
                   <div className="flex gap-4 text-sm pt-2 border-t border-red-200">
                     <div>
                       <span className="font-semibold text-red-800">Detected</span>
                       <p className="text-red-700">{validationData.category}</p>
                     </div>
                     <div>
                       <span className="font-semibold text-red-800">Confidence</span>
                       <p className="text-red-700">{validationData.confidence}%</p>
                     </div>
                   </div>
                 )}
                 <button 
                   onClick={handleReset}
                   className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                 >
                   <Trash2 size={16} />
                   Try Again
                 </button>
              </motion.div>
           )}
        </div>
      )}
    </div>
  );
}

