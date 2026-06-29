"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";

interface Order { id: string; status: string; total: number; delivery_address: string; created_at: string; }

const STATUS_LABELS: Record<string, string> = { pending: "Pendiente", accepted: "Aceptado", picked_up: "Recogido", in_transit: "En camino", delivered: "Entregado", cancelled: "Cancelado" };
const STATUS_COLORS: Record<string, string> = { pending: "bg-yellow-100 text-yellow-700", accepted: "bg-blue-100 text-blue-700", picked_up: "bg-indigo-100 text-indigo-700", in_transit: "bg-purple-100 text-purple-700", delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700" };
const ACTIVE = ["pending", "accepted", "picked_up", "in_transit"];
const DONE = ["delivered", "cancelled"];

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "active" | "done">("all");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api<{ orders: Order[] }>("/orders")
      .then((d) => setOrders(d.orders.map((o) => ({ ...o, total: Number(o.total) }))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const filtered = orders.filter((o) => {
    if (tab === "active") return ACTIVE.includes(o.status);
    if (tab === "done") return DONE.includes(o.status);
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5] pb-24">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <h1 className="font-bold text-lg text-gray-900">Mis pedidos</h1>
        </div>
        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 flex gap-1 pb-3">
          {[{ key: "all", label: "Todos" }, { key: "active", label: "En curso" }, { key: "done", label: "Completados" }].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${tab === t.key ? "bg-[#25c462] text-white" : "bg-gray-100 text-gray-600"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 space-y-3">
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <p className="text-5xl mb-3">📦</p>
            <p className="text-sm">No hay pedidos aquí</p>
            {tab === "all" && user.role === "customer" && (
              <button onClick={() => router.push("/menu")} className="mt-4 bg-[#25c462] text-white px-6 py-2.5 rounded-2xl font-semibold text-sm">Ver menú</button>
            )}
          </div>
        ) : filtered.map((order) => (
          <button
            key={order.id}
            onClick={() => router.push(user.role === "dealer" ? `/dealer/orders/${order.id}` : `/orders/${order.id}`)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm text-left active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🍔</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-gray-900">Burger House</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>{STATUS_LABELS[order.status] || order.status}</span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{order.delivery_address}</p>
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-gray-50 pt-2">
              <p className="text-xs text-gray-400">
                {new Date(order.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900 text-sm">${order.total.toLocaleString("es-CO")}</span>
                <span className="text-xs text-[#25c462] font-semibold">Ver →</span>
              </div>
            </div>
          </button>
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
