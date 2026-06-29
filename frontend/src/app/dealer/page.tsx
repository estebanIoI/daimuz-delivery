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

export default function DealerPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "dealer") {
      router.push(user.role === "customer" ? "/menu" : "/admin");
      return;
    }
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [user, router]);

  const loadData = async () => {
    try {
      const [avail, active] = await Promise.all([
        api<{ orders: Order[] }>("/delivery/available"),
        api<{ orders: Order[] }>("/delivery/my-active"),
      ]);
      setAvailableOrders(avail.orders);
      setActiveOrders(active.orders);
    } catch {
      // ignore
    } finally {
      setLoading(false);
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
        <div className="bg-gradient-to-r from-[#ff6b35] to-[#ff8c5a] rounded-2xl p-5 text-white">
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
                    <span className="text-[#ff6b35] font-bold">${order.total.toFixed(0)}</span>
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
                    <span className="text-[#ff6b35] font-bold">${order.total.toFixed(0)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{order.delivery_address}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {order.customer_name} · {order.customer_phone}
                  </p>
                  <button
                    onClick={() => handleAccept(order.id)}
                    disabled={accepting === order.id}
                    className="mt-3 w-full bg-[#ff6b35] text-white py-2.5 rounded-xl font-medium hover:bg-[#e55a2b] disabled:opacity-50 transition-colors"
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
