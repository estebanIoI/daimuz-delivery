"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { useZoneStore } from "@/stores/zoneStore";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";

export default function CheckoutPage() {
  const user = useAuthStore((s) => s.user);
  const { items, total, clearCart } = useCartStore();
  const { userLat, userLng, validate, allowed } = useZoneStore();
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (items.length === 0) {
      router.push("/cart");
      return;
    }
  }, [user, items, router]);

  const handleGetLocation = () => {
    setGettingLocation(true);
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocalización no soportada");
      setGettingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        validate(pos.coords.latitude, pos.coords.longitude);
        setGettingLocation(false);
      },
      () => {
        setError("No se pudo obtener tu ubicación. Permite el acceso a GPS.");
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userLat || !userLng) {
      setError("Primero obtén tu ubicación");
      return;
    }

    if (!address.trim()) {
      setError("Ingresa la dirección de entrega");
      return;
    }

    if (allowed === false) {
      setError("No hay servicio en tu zona actual");
      return;
    }

    setLoading(true);
    try {
      const data = await api<{ order: { id: string } }>("/orders", {
        method: "POST",
        body: {
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
          delivery_address: address,
          delivery_lat: userLat,
          delivery_lng: userLng,
          notes: notes || undefined,
        },
      });

      clearCart();
      router.push(`/orders/${data.order.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear el pedido");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4">
        <h2 className="text-xl font-bold mb-4">Finalizar pedido</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-medium text-sm text-gray-700 mb-2">Ubicación de entrega</h3>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={gettingLocation}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl py-6 text-gray-500 hover:border-[#ff6b35] hover:text-[#ff6b35] transition-colors disabled:opacity-50"
            >
              {gettingLocation ? "📍 Obteniendo ubicación..." : userLat ? "📍 Ubicación obtenida ✅" : "📍 Toca para obtener tu ubicación"}
            </button>
            {allowed === false && (
              <p className="text-red-500 text-xs mt-1">Servicio no disponible en tu zona</p>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de entrega</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent"
              placeholder="Calle, número, referencia..."
              required
            />
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent resize-none"
              placeholder="Ej: Timbre no funciona, llamar al llegar..."
              rows={2}
            />
          </div>

          <div className="bg-[#fff5f0] rounded-xl p-4 border border-[#ff6b35]/20">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">{items.length} producto(s)</span>
              <span className="text-2xl font-bold text-[#ff6b35]">${total().toFixed(0)}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff6b35] text-white py-3.5 rounded-xl font-medium hover:bg-[#e55a2b] disabled:opacity-50 transition-colors text-lg"
          >
            {loading ? "Creando pedido..." : "Realizar pedido"}
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
}
