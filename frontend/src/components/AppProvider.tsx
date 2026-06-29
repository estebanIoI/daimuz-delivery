"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return <>{children}</>;
}
