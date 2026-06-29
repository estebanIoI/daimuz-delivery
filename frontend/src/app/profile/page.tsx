"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { BottomNav } from "@/components/BottomNav";

const RANK_NEXT: Record<string, { next: string; xpNeeded: number }> = {
  Bronze: { next: "Silver", xpNeeded: 1000 },
  Silver: { next: "Gold", xpNeeded: 5000 },
  Gold: { next: "Elite", xpNeeded: 15000 },
  Elite: { next: "Elite", xpNeeded: 15000 },
};

const RANK_EMOJI: Record<string, string> = {
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🥇",
  Elite: "💎",
};

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5] px-6 pb-24">
        <p className="text-5xl mb-4">👤</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Inicia sesión</h2>
        <p className="text-gray-500 text-sm mb-6 text-center">Para ver tu perfil, puntos y pedidos</p>
        <button onClick={() => router.push("/login")} className="w-full max-w-xs bg-[#25c462] text-white py-3.5 rounded-2xl font-semibold">Iniciar sesión</button>
        <button onClick={() => router.push("/register")} className="mt-3 w-full max-w-xs border-2 border-gray-200 text-gray-600 py-3.5 rounded-2xl font-semibold">Crear cuenta</button>
        <BottomNav />
      </div>
    );
  }

  const points = user.wallet?.points ?? 0;
  const xp = user.dealerStats?.xp ?? 0;
  const rank = user.dealerStats?.rank ?? "Bronze";
  const rankInfo = RANK_NEXT[rank] || RANK_NEXT["Bronze"];
  const xpProgress = Math.min(100, (xp / rankInfo.xpNeeded) * 100);

  const handleLogout = () => {
    logout();
    router.push("/menu");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5] pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-lg text-gray-900">Mi cuenta</h1>
          <button className="p-2 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 space-y-3">
        {/* Avatar + nombre */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#25c462]/10 flex items-center justify-center text-2xl font-bold text-[#25c462]">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg leading-tight">{user.name}</p>
            <p className="text-gray-400 text-sm capitalize">{user.role === "customer" ? "Cliente" : user.role === "dealer" ? "Dealer" : "Admin"}</p>
            <p className="text-gray-400 text-xs mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Puntos - solo para customer */}
        {user.role === "customer" && (
          <div className="bg-gray-900 rounded-2xl p-5 shadow-sm text-white">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-400 text-sm">Mis puntos</p>
              <span className="text-yellow-400 text-lg">⭐</span>
            </div>
            <p className="text-4xl font-bold mb-1">{points.toLocaleString()} <span className="text-xl text-gray-400">pts</span></p>
            <button className="text-[#25c462] text-sm font-semibold">Canjear puntos →</button>
          </div>
        )}

        {/* Rango - para dealer */}
        {user.role === "dealer" && (
          <div className="bg-gray-900 rounded-2xl p-5 shadow-sm text-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Mi rango</p>
                <p className="text-2xl font-bold">{RANK_EMOJI[rank]} {rank}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs">XP total</p>
                <p className="text-xl font-bold text-[#25c462]">{xp.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-gray-700 rounded-full h-2 mb-1">
              <div className="bg-[#25c462] h-2 rounded-full transition-all" style={{ width: `${xpProgress}%` }} />
            </div>
            <p className="text-gray-400 text-xs">{xp} / {rankInfo.xpNeeded} XP para {rankInfo.next}</p>

            {user.dealerStats && (
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-700">
                <div className="text-center">
                  <p className="text-xl font-bold">{user.dealerStats.completed_orders}</p>
                  <p className="text-gray-400 text-[10px]">Entregas</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">⭐ {Number(user.dealerStats.rating_avg).toFixed(1)}</p>
                  <p className="text-gray-400 text-[10px]">Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{xp}</p>
                  <p className="text-gray-400 text-[10px]">XP</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Menú opciones */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {user.role === "customer" && (
            <button onClick={() => router.push("/orders")} className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-xl">📦</span>
                <span className="text-sm font-medium text-gray-800">Mis pedidos</span>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
          <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">📍</span>
              <span className="text-sm font-medium text-gray-800">Mis direcciones</span>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
          <button className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">👥</span>
              <span className="text-sm font-medium text-gray-800">Invitar amigos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-[#25c462]/10 text-[#25c462] font-semibold px-2 py-0.5 rounded-full">Gana 200 pts</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
          <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 active:bg-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">❓</span>
              <span className="text-sm font-medium text-gray-800">Ayuda y soporte</span>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Cerrar sesión */}
        <button onClick={handleLogout} className="w-full bg-white rounded-2xl px-4 py-4 shadow-sm text-red-500 font-semibold text-sm text-left flex items-center gap-3">
          <span className="text-xl">🚪</span>
          Cerrar sesión
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
