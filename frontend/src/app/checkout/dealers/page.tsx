"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";

interface Dealer { id: string; name: string; avatar_url: string | null; completed_orders: number; rating_avg: number; xp: number; rank: string; }

const RANK_COLOR: Record<string, string> = { Bronze: "text-amber-600 bg-amber-50", Silver: "text-gray-500 bg-gray-100", Gold: "text-yellow-600 bg-yellow-50", Elite: "text-purple-600 bg-purple-50" };
const RANK_EMOJI: Record<string, string> = { Bronze: "🥉", Silver: "🥈", Gold: "🥇", Elite: "💎" };

export default function SelectDealerPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("order_id");

  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !orderId) { router.push("/"); return; }
    api<{ dealers: Dealer[] }>("/dealers/available")
      .then((d) => setDealers(d.dealers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, orderId]);

  const handleSelect = async (dealerId: string) => {
    if (!orderId) return;
    setSelecting(dealerId);
    try {
      await api("/dealers/request", { method: "POST", body: { order_id: orderId, dealer_id: dealerId } });
      router.push(`/orders/${orderId}`);
    } catch {
      setSelecting(null);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1">
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="font-bold text-gray-900">Elegir Dealer</h1>
            <p className="text-xs text-gray-400">Selecciona quién te entrega</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 space-y-3">
        <div className="bg-[#25c462]/10 rounded-2xl p-4 text-center mb-2">
          <p className="text-[#1aaa52] text-sm font-semibold">🛵 ¡Tú eliges quién te entrega!</p>
          <p className="text-gray-500 text-xs mt-0.5">El dealer recibirá tu solicitud y puede aceptar o rechazar</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)}
          </div>
        ) : dealers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">🛵</p>
            <p className="text-sm font-medium">No hay dealers disponibles</p>
            <p className="text-xs mt-1">Intenta más tarde</p>
          </div>
        ) : (
          dealers.map((dealer) => (
            <div key={dealer.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl font-bold text-[#25c462] flex-shrink-0 overflow-hidden">
                {dealer.avatar_url
                  ? <img src={dealer.avatar_url} alt={dealer.name} className="w-full h-full object-cover" />
                  : dealer.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-gray-900 text-sm">{dealer.name}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${RANK_COLOR[dealer.rank] || RANK_COLOR.Bronze}`}>
                    {RANK_EMOJI[dealer.rank]} {dealer.rank}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>⭐ {dealer.rating_avg.toFixed(1)}</span>
                  <span>📦 {dealer.completed_orders} entregas</span>
                  <span>✨ {dealer.xp} XP</span>
                </div>
              </div>

              {/* Botón */}
              <button
                onClick={() => handleSelect(dealer.id)}
                disabled={selecting === dealer.id}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${selecting === dealer.id ? "bg-gray-100 text-gray-400" : "bg-[#25c462] text-white hover:bg-[#1aaa52] active:scale-95"}`}
              >
                {selecting === dealer.id ? "..." : "Elegir"}
              </button>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
