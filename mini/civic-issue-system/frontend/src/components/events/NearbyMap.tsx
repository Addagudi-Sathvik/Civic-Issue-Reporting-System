"use client";

import dynamic from 'next/dynamic';

const NearbyMapClient = dynamic(() => import('./NearbyMapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full glass p-6">
      <div className="w-full h-[400px] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-500 font-medium">
        Loading interactive map...
      </div>
    </div>
  )
});

export default function NearbyMap(props: any) {
  return <NearbyMapClient {...props} />
}