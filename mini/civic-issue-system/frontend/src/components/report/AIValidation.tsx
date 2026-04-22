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

  // ✅ Works in both local & deployed
  const BASE_URL =
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";

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

  const validateImage = async (selectedFile: File) => {
    if (!category) {
      setStatus("error");
      setErrorMsg("❌ Please select a category first.");
      onValidationFail();
      return;
    }

    setStatus("validating");

    try {
      const formData = new FormData();
      formData.append("media", selectedFile);
      formData.append("category", category);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;

      const response = await fetch(
        `${BASE_URL}/api/issues/validate-image`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData, // ❗ DO NOT set content-type manually
        }
      );

      const data = await response.json();

      setValidationData(data);

      if (response.ok && data.valid) {
        setStatus("success");
        onValidationSuccess(selectedFile);
      } else {
        setStatus("error");
        setErrorMsg(data.message || "Validation failed");
        onValidationFail();
      }
    } catch (err: any) {
      console.error("Validation error:", err);

      setStatus("error");
      setErrorMsg("❌ Cannot reach validation server");
      onValidationFail();
    }
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

          <h3 className="text-lg font-bold text-slate-800">
            Upload Image Proof
          </h3>

          <p className="text-sm font-medium text-slate-500 mt-1 max-w-xs">
            AI will verify the image matches your selected category
          </p>

          <p className="text-xs text-slate-400 mt-2">
            Max 5MB • JPG, PNG supported
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative w-full h-48 rounded-2xl overflow-hidden glass shadow-md border border-slate-200">
            <img
              src={preview}
              alt="Upload preview"
              className="w-full h-full object-cover"
            />

            <AnimatePresence>
              {status === "validating" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center text-white"
                >
                  <Loader2 size={40} className="animate-spin mb-3 text-blue-400" />
                  <p className="font-bold">Validating Image...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {status === "success" && validationData && (
            <p className="text-green-600 font-bold">
              ✅ {validationData.message}
            </p>
          )}

          {status === "error" && (
            <div>
              <p className="text-red-600">{errorMsg}</p>
              <button onClick={handleReset}>Try Again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
