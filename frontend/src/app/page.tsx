"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useZoneStore } from "@/stores/zoneStore";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const { allowed, message, checking, validate } = useZoneStore();
  const [geoError, setGeoError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "dealer") {
      router.replace("/dealer");
    } else if (user?.role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/menu");
    }
  }, [user, router]);

  const handleGetLocation = () => {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no soporta geolocalización");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        validate(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setGeoError("No se pudo obtener tu ubicación. Permite el acceso a GPS.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-[#ff6b35]">DAIMUZ</h1>
            <p className="text-gray-500">Delivery local rápido y seguro</p>
          </div>

          {!user && (
            <div className="space-y-4">
              <button
                onClick={handleGetLocation}
                disabled={checking}
                className="w-full bg-[#ff6b35] text-white py-3 rounded-xl font-medium hover:bg-[#e55a2b] disabled:opacity-50 transition-colors"
              >
                {checking ? "Verificando ubicación..." : "📍 Verificar mi zona"}
              </button>

              {geoError && (
                <p className="text-red-500 text-sm">{geoError}</p>
              )}

              {allowed === false && message && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600 text-sm font-medium">{message}</p>
                </div>
              )}

              {allowed === true && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-600 text-sm font-medium">✅ {message || "Zona disponible"}</p>
                  <button
                    onClick={() => router.push("/login")}
                    className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700"
                  >
                    Iniciar sesión para continuar
                  </button>
                </div>
              )}

              <div className="flex gap-2 text-sm text-gray-400 justify-center">
                <span>¿Ya tienes cuenta?</span>
                <button onClick={() => router.push("/login")} className="text-[#ff6b35] font-medium">
                  Iniciar sesión
                </button>
              </div>
            </div>
          )}

          {user && (
            <p className="text-gray-500">Redirigiendo...</p>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
