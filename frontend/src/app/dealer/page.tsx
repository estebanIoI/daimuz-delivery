"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";

interface Order {
  id: string;
  status: string;
  total: number;
  delivery_address: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
}

interface DealerRequest {
  id: string;
  order_id: string;
  status: string;
  total: number;
  delivery_address: string;
  notes: string | null;
  created_at: string;
}

export default function DealerPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [requests, setRequests] = useState<DealerRequest[]>([]);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "dealer") {
      router.push(user.role === "customer" ? "/" : "/admin");
      return;
    }
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [user, router]);

  const loadData = async () => {
    try {
      const [reqs, avail, active] = await Promise.all([
        api<{ requests: DealerRequest[] }>("/dealers/requests").catch(() => ({ requests: [] })),
        api<{ orders: Order[] }>("/delivery/available").catch(() => ({ orders: [] })),
        api<{ orders: Order[] }>("/delivery/my-active").catch(() => ({ orders: [] })),
      ]);
      setRequests((reqs.requests || []).map((r) => ({ ...r, total: Number(r.total) })));
      setAvailableOrders(avail.orders);
      setActiveOrders(active.orders);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId: string, action: "accept" | "reject") => {
    setResponding(requestId);
    try {
      await api(`/dealers/respond/${requestId}`, { method: "POST", body: { action } });
      loadData();
    } catch {
      // ignore
    } finally {
      setResponding(null);
    }
  };

  const handleAccept = async (orderId: string) => {
    setAccepting(orderId);
    try {
      await api(`/delivery/accept/${orderId}`, { method: "POST" });
      loadData();
    } catch {
      // ignore
    } finally {
      setAccepting(null);
    }
  };

  if (!user || user.role !== "dealer") return null;

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-6">
        <div className="bg-gradient-to-r from-[#25c462] to-[#4cd97e] rounded-2xl p-5 text-white">
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-sm opacity-80 mt-1">
            {user.dealerStats?.rank || "Bronze"} · {user.dealerStats?.xp || 0} XP
          </p>
          <div className="flex gap-4 mt-3 text-sm">
            <div>
              <p className="font-bold">{user.dealerStats?.completed_orders || 0}</p>
              <p className="opacity-70 text-xs">Entregas</p>
            </div>
            <div>
              <p className="font-bold">{user.dealerStats?.rating_avg?.toFixed(1) || "0.0"}</p>
              <p className="opacity-70 text-xs">Rating</p>
            </div>
          </div>
        </div>

        {/* Solicitudes dirigidas a este dealer */}
        {requests.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-700 mb-2">🔔 Te eligieron ({requests.length})</h3>
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r.id} className="bg-[#f0fdf4] border border-[#25c462]/40 rounded-xl p-4">
                  <div className="flex justify-between mb-1">
                    <p className="font-semibold text-sm">Pedido #{r.order_id.slice(0, 8)}</p>
                    <span className="text-[#25c462] font-bold">${r.total.toLocaleString("es-CO")}</span>
                  </div>
                  <p className="text-sm text-gray-600">{r.delivery_address}</p>
                  {r.notes && <p className="text-xs text-gray-400 mt-1">📝 {r.notes}</p>}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleRespond(r.id, "reject")}
                      disabled={responding === r.id}
                      className="flex-1 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => handleRespond(r.id, "accept")}
                      disabled={responding === r.id}
                      className="flex-1 bg-[#25c462] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1aaa52] disabled:opacity-50"
                    >
                      {responding === r.id ? "..." : "Aceptar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeOrders.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-700 mb-2">🚀 Pedidos activos</h3>
            <div className="space-y-2">
              {activeOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => router.push(`/dealer/orders/${order.id}`)}
                  className="w-full bg-blue-50 border border-blue-200 rounded-xl p-4 text-left hover:bg-blue-100 transition-colors"
                >
                  <div className="flex justify-between">
                    <p className="font-medium text-sm">#{order.id.slice(0, 8)}</p>
                    <span className="text-[#25c462] font-bold">${order.total.toFixed(0)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{order.delivery_address}</p>
                  <p className="text-xs text-blue-600 mt-1">📍 {order.customer_name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-bold text-gray-700 mb-2">📋 Pedidos disponibles</h3>
          {loading ? (
            <p className="text-gray-400 text-sm">Buscando pedidos...</p>
          ) : availableOrders.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <p className="text-gray-400">No hay pedidos disponibles</p>
              <p className="text-gray-300 text-xs mt-1">Esperando nuevos pedidos...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">Pedido #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="text-[#25c462] font-bold">${order.total.toFixed(0)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{order.delivery_address}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {order.customer_name} · {order.customer_phone}
                  </p>
                  <button
                    onClick={() => handleAccept(order.id)}
                    disabled={accepting === order.id}
                    className="mt-3 w-full bg-[#25c462] text-white py-2.5 rounded-xl font-medium hover:bg-[#1aaa52] disabled:opacity-50 transition-colors"
                  >
                    {accepting === order.id ? "Aceptando..." : "Aceptar pedido"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
