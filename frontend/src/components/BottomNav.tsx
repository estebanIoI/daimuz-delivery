"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";

export function BottomNav() {
  const user = useAuthStore((s) => s.user);
  const itemCount = useCartStore((s) => s.itemCount);
  const router = useRouter();
  const path = usePathname();

  if (user?.role === "admin") return null;

  const isDealer = user?.role === "dealer";

  const active = (route: string) =>
    path === route || path.startsWith(route + "/")
      ? "text-[#25c462]"
      : "text-gray-400";

  if (isDealer) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-bottom">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16">
          <button onClick={() => router.push("/dealer")} className={`flex flex-col items-center gap-0.5 ${active("/dealer")}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <span className="text-[10px] font-medium">Pedidos</span>
          </button>
          <button onClick={() => router.push("/orders")} className={`flex flex-col items-center gap-0.5 ${active("/orders")}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[10px] font-medium">Historial</span>
          </button>
          <button onClick={() => router.push("/profile")} className={`flex flex-col items-center gap-0.5 ${active("/profile")}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px] font-medium">Cuenta</span>
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {/* Inicio */}
        <button onClick={() => router.push("/")} className={`flex flex-col items-center gap-0.5 ${path === "/" ? "text-[#25c462]" : "text-gray-400"}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[10px] font-medium">Inicio</span>
        </button>

        {/* Pedidos */}
        <button onClick={() => user ? router.push("/orders") : router.push("/login")} className={`flex flex-col items-center gap-0.5 ${active("/orders")}`}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <span className="text-[10px] font-medium">Pedidos</span>
        </button>

        {/* Chat */}
        <button onClick={() => user ? router.push("/orders") : router.push("/login")} className="flex flex-col items-center gap-0.5 text-gray-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span className="text-[10px] font-medium">Chat</span>
        </button>

        {/* Cuenta */}
        <button onClick={() => user ? router.push("/profile") : router.push("/login")} className={`flex flex-col items-center gap-0.5 relative ${active("/profile")}`}>
          <div className="relative">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            {itemCount() > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#25c462] text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {itemCount()}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Cuenta</span>
        </button>
      </div>
    </nav>
  );
}
