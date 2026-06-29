"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useZoneStore } from "@/stores/zoneStore";

interface Props {
  onConfirmed: () => void;
  onClose: () => void;
}

export function LocationModal({ onConfirmed, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const { allowed, message, checking, validate } = useZoneStore();
  const [geoError, setGeoError] = useState("");
  const router = useRouter();

  const handleGetLocation = () => {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no soporta geolocalización");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => validate(pos.coords.latitude, pos.coords.longitude),
      () => setGeoError("No se pudo obtener tu ubicación. Permite el acceso a GPS."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-6">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">📍</div>
          <h2 className="text-lg font-bold text-gray-900">Verificar zona de entrega</h2>
          <p className="text-sm text-gray-500 mt-1">
            Necesitamos confirmar que hacemos entregas en tu ubicación.
          </p>
        </div>

        {allowed === null && (
          <button
            onClick={handleGetLocation}
            disabled={checking}
            className="w-full bg-[#ff6b35] text-white py-3 rounded-xl font-medium hover:bg-[#e55a2b] disabled:opacity-50 transition-colors"
          >
            {checking ? "Verificando..." : "Usar mi ubicación actual"}
          </button>
        )}

        {geoError && (
          <p className="text-red-500 text-sm text-center">{geoError}</p>
        )}

        {allowed === false && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-600 text-sm font-medium">{message}</p>
            <p className="text-red-400 text-xs mt-1">Lo sentimos, por ahora no llegamos a tu zona.</p>
          </div>
        )}

        {allowed === true && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-600 text-sm font-medium">✅ {message || "Zona disponible"}</p>
            </div>
            {!user ? (
              <button
                onClick={() => { onClose(); router.push("/login"); }}
                className="w-full bg-[#ff6b35] text-white py-3 rounded-xl font-medium hover:bg-[#e55a2b] transition-colors"
              >
                Iniciar sesión para pedir
              </button>
            ) : (
              <button
                onClick={onConfirmed}
                className="w-full bg-[#ff6b35] text-white py-3 rounded-xl font-medium hover:bg-[#e55a2b] transition-colors"
              >
                Agregar al carrito
              </button>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full text-gray-400 text-sm py-2 hover:text-gray-600"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
