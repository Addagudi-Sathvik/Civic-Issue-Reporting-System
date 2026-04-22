"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ThumbsUp, Map, AlertCircle, Loader2, CheckCircle, Users } from "lucide-react";
import api from "@/lib/api";

interface NearbyIssuesProps {
  lat: number;
  lng: number;
  category: string;
  onReposted: () => void;
}

export default function NearbyIssues({ lat, lng, category, onReposted }: NearbyIssuesProps) {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});
  const [confirmingIds, setConfirmingIds] = useState<Record<string, boolean>>({});
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!lat || !lng) return;
    setLoading(true);

    const fetchNearby = async () => {
      try {
        const response = await api.post("/issues/nearby", {
          lat,
          lng,
          category,
          radiusKm: 3,
        });

        if (Array.isArray(response.data)) {
          setIssues(response.data);
        } else {
          setIssues([]);
        }
      } catch (err: any) {
        console.error("Failed to load nearby issues:", err?.response || err);
        setIssues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNearby();
  }, [lat, lng, category]);

  const handleSupport = async (id: string) => {
    setSubmittingIds(prev => ({...prev, [id]: true}));
    try {
      const res = await api.post(`/issues/${id}/vote`);
      if (res.status === 200) {
         onReposted();
      } else {
         alert(res.data?.message || "Failed to upvote");
      }
    } catch(err) {
      alert("Error processing support vote.");
    } finally {
      setSubmittingIds(prev => ({...prev, [id]: false}));
    }
  };

  const handleConfirm = async (id: string) => {
    setConfirmingIds(prev => ({...prev, [id]: true}));
    try {
      const res = await api.post(`/confirmations/${id}/confirm`, {
         confidence: 5,
      });
      if (res.status === 200) {
         setConfirmedIds(prev => {
            const nextSet = new Set(prev);
            nextSet.add(id);
            return nextSet;
         });
      } else {
         alert(res.data?.message || "Failed to confirm issue");
      }
    } catch(err) {
      alert("Error processing confirmation.");
    } finally {
      setConfirmingIds(prev => ({...prev, [id]: false}));
    }
  };

  const getPriorityColor = (priority: string) => {
     if(priority === 'HIGH' || priority === 'URGENT') return 'bg-red-100 text-red-700 border-red-200';
     if(priority === 'MEDIUM') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
     return 'bg-green-100 text-green-700 border-green-200';
  };

  if(!lat || !lng) return null;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
         <Map className="text-secondary" />
         <h3 className="text-lg font-bold text-slate-800">Nearby Issues / Similar Reports</h3>
      </div>
      
      {loading ? (
         <div className="flex items-center gap-3 p-6 glass rounded-2xl bg-slate-50 border border-slate-200 justify-center">
            <Loader2 className="animate-spin text-primary" />
            <span className="font-semibold text-slate-600">Scanning satellite data for matching reports...</span>
         </div>
      ) : issues.length === 0 ? (
         <div className="flex items-start gap-3 p-6 glass rounded-2xl bg-blue-50 border border-blue-200 shadow-inner">
            <AlertCircle className="text-blue-500 shrink-0" />
            <div>
               <span className="font-bold text-blue-800 block">No matching reports within 2km.</span>
               <span className="text-sm font-medium text-blue-600">You are the first to report this issue! You will receive a +50 Point Bonus upon submission.</span>
            </div>
         </div>
      ) : (
         <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-slate-500 mb-2">We found similar problems reported nearby. Does your issue match one of these? Supporting an existing issue prioritizes it faster.</p>
            {issues.map(issue => (
               <motion.div 
                 key={issue._id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="flex flex-col sm:flex-row items-center justify-between p-4 glass rounded-2xl bg-white border border-slate-200 shadow-sm gap-4 hover:shadow-md transition-shadow"
               >
                 <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                       <h4 className="font-bold text-slate-800 text-lg">{issue.title}</h4>
                       <span className="bg-red-100 text-red-700 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-red-200">Already Reported Nearby</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                       <span className={`px-2 py-0.5 rounded border ${getPriorityColor(issue.priority || 'LOW')}`}>
                         {issue.priority || 'LOW'} Priority
                       </span>
                       <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{issue.category}</span>
                       <span className="text-slate-500 flex items-center gap-1"><ThumbsUp size={12}/> {issue.votes || 0} Votes</span>
                       <span className="text-slate-500 flex items-center gap-1"><MapPin size={12}/> {`< 3km`}</span>
                    </div>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                   <button 
                      onClick={() => handleSupport(issue._id)}
                      disabled={submittingIds[issue._id]}
                      className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm rounded-xl hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                   >
                      {submittingIds[issue._id] ? <Loader2 size={16} className="animate-spin" /> : <><ThumbsUp size={16} /> Repost / Support</>}
                   </button>
                   
                   {!confirmedIds.has(issue._id) ? (
                     <button 
                        onClick={() => handleConfirm(issue._id)}
                        disabled={confirmingIds[issue._id]}
                        className="flex-1 sm:flex-none px-4 py-2 bg-green-500 text-white font-bold text-sm rounded-xl hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                     >
                        {confirmingIds[issue._id] ? <Loader2 size={16} className="animate-spin" /> : <><Users size={16} /> Confirm</>}
                     </button>
                   ) : (
                     <div className="flex-1 sm:flex-none px-4 py-2 bg-green-100 text-green-700 font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                        <CheckCircle size={16} /> Confirmed
                     </div>
                   )}
                 </div>
               </motion.div>
            ))}
         </div>
      )}
    </div>
  );
}
