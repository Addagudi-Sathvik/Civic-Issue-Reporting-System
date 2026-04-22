"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setInitialState = useAuthStore((state) => state.setInitialState);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setInitialState();
    setMounted(true);
  }, [setInitialState]);

  if (!mounted) return <div className="min-h-screen bg-background" />; // Prevent hydration mismatch

  return <>{children}</>;
}
