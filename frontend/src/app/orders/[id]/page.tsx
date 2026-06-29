"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { api, apiUpload } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";

interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: string;
  message_type: string;
  message: string;
  image_url: string | null;
  created_at: string;
  is_read: number;
  sender_name: string;
}

interface OrderDetail {
  id: string;
  status: string;
  total: number;
  delivery_address: string;
  created_at: string;
  dealer_id: string | null;
  validation_id: string | null;
}

interface OrderValidation {
  validation_code: string;
  qr_token: string;
  validated: number;
}

interface TrackingPoint {
  lat: number;
  lng: number;
  recorded_at: string;
}

const STATUS_STEPS = ["pending", "accepted", "picked_up", "in_transit", "delivered"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptado",
  picked_up: "Recogido",
  in_transit: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tracking, setTracking] = useState<TrackingPoint | null>(null);
  const [validation, setValidation] = useState<OrderValidation | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadOrder();
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [id, user]);

  const loadOrder = async () => {
    try {
      const data = await api<{
        order: OrderDetail;
        messages: Message[];
        tracking: TrackingPoint | null;
      }>(`/orders/${id}`);
      setOrder(data.order);
      setMessages(data.messages || []);
      setTracking(data.tracking);
      if (data.order.validation_id) {
        try {
          const vData = await api<{ validation: OrderValidation }>(`/orders/${id}/validation`);
          setValidation(vData.validation);
        } catch { /* ignore */ }
      }
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    } catch {
      // ignore
    }
  };

  const handleSend = async () => {
    if (!newMsg.trim()) return;
    setSending(true);
    try {
      await api(`/chat/orders/${id}/messages`, {
        method: "POST",
        body: { message: newMsg, message_type: "text" },
      });
      setNewMsg("");
      loadOrder();
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadData = await apiUpload(file);
      await api(`/chat/orders/${id}/messages`, {
        method: "POST",
        body: { image_url: `http://localhost:4000${uploadData.url}`, message_type: "image", message: "" },
      });
      loadOrder();
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
  };

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <main className="flex-1 max-w-lg mx-auto w-full flex flex-col">
        {order && (
          <>
            <div className="bg-white border-b border-gray-100 px-4 py-3">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold">Pedido #{order.id.slice(0, 8)}</h2>
                <span className="text-[#ff6b35] font-bold">${order.total.toFixed(0)}</span>
              </div>

              <div className="flex items-center gap-1 mb-2">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex-1 flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        i <= currentStep && order.status !== "cancelled"
                          ? "bg-[#25c462]"
                          : "bg-gray-200"
                      }`}
                    />
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 ${
                          i < currentStep && order.status !== "cancelled"
                            ? "bg-[#25c462]"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {STATUS_LABELS[order.status]} · {order.delivery_address}
              </p>

              {/* Código de validación QR */}
              {validation && !validation.validated && order.status !== "delivered" && (
                <div className="mt-3 bg-[#f0fdf4] border border-[#25c462]/30 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Muestra este código al dealer</p>
                  <p className="text-3xl font-black text-gray-900 tracking-widest font-mono">{validation.validation_code}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Código de validación de entrega</p>
                </div>
              )}
              {validation?.validated === 1 && (
                <div className="mt-2 bg-green-50 rounded-xl p-2 text-center">
                  <p className="text-xs text-green-600 font-semibold">✅ Entrega validada</p>
                </div>
              )}
              {!order.dealer_id && order.status === "pending" && (
                <button
                  onClick={() => router.push(`/checkout/dealers?order_id=${order.id}`)}
                  className="mt-2 w-full bg-[#25c462] text-white py-2 rounded-xl text-xs font-semibold hover:bg-[#1aaa52]"
                >
                  🛵 Elegir dealer
                </button>
              )}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[50vh]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.message_type === "system"
                        ? "bg-gray-100 text-gray-500 text-xs text-center mx-auto"
                        : msg.sender_id === user.id
                        ? "bg-[#25c462] text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {msg.sender_role !== "system" && msg.sender_id !== user.id && (
                      <p className="text-xs font-medium mb-0.5 opacity-70">{msg.sender_name}</p>
                    )}
                    {msg.message_type === "image" && msg.image_url ? (
                      <img src={msg.image_url} alt="Imagen" className="rounded-lg max-w-full" />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    )}
                    <p className="text-right text-[10px] opacity-50 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {uploading && (
                <div className="text-center text-gray-400 text-sm">Subiendo imagen...</div>
              )}
            </div>

            {(order.status !== "delivered" && order.status !== "cancelled") && (
              <div className="border-t border-gray-100 bg-white px-4 py-3 flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  📎
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <input
                  type="text"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462] focus:border-transparent"
                  placeholder={
                    order.status === "pending"
                      ? "Chat habilitado cuando un dealer acepte..."
                      : "Escribe un mensaje..."
                  }
                  disabled={order.status === "pending" || !order.dealer_id}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMsg.trim() || order.status === "pending"}
                  className="bg-[#25c462] text-white rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-50 hover:bg-[#e55a2b] transition-colors"
                >
                  ➤
                </button>
              </div>
            )}
          </>
        )}
      </main>
      {user.role === "customer" && <BottomNav />}
    </div>
  );
}
