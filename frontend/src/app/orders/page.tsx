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
  customer_name?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptado",
  picked_up: "Recogido",
  in_transit: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  picked_up: "bg-indigo-100 text-indigo-700",
  in_transit: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadOrders();
  }, [user, router]);

  const loadOrders = async () => {
    try {
      const data = await api<{ orders: Order[] }>("/orders");
      setOrders(data.orders);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4">
        <h2 className="text-xl font-bold mb-4">Mis pedidos</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-gray-400 text-lg">📦</p>
            <p className="text-gray-500">No tienes pedidos aún</p>
            {user.role === "customer" && (
              <button
                onClick={() => router.push("/menu")}
                className="bg-[#ff6b35] text-white px-6 py-2.5 rounded-xl hover:bg-[#e55a2b]"
              >
                Ir al menú
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() =>
                  router.push(
                    user.role === "dealer"
                      ? `/dealer/orders/${order.id}`
                      : `/orders/${order.id}`
                  )
                }
                className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:border-[#ff6b35]/30 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-sm">Pedido #{order.id.slice(0, 8)}</p>
                    {order.customer_name && (
                      <p className="text-xs text-gray-400 mt-0.5">{order.customer_name}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">
                    {new Date(order.created_at).toLocaleDateString("es-CO", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="font-bold text-[#ff6b35]">${order.total.toFixed(0)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
      {user.role === "customer" && <BottomNav />}
    </div>
  );
}
