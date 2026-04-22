"use client";

import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full flex flex-col gap-4">
      <div className="w-full h-[300px] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-500 font-medium">
        Loading interactive map...
      </div>
    </div>
  )
});

export default function MapComponent(props: any) {
  return <MapClient {...props} />
}
