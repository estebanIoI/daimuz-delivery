"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useZoneStore } from "@/stores/zoneStore";
import { api } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";

interface Commerce {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo_url: string | null;
  banner_url: string | null;
  city: string;
  is_open: number;
  avg_delivery_time: string;
  delivery_fee: number;
  rating: number;
  product_count: number;
}

const CATEGORY_FILTERS = ["Todos", "Hamburguesas", "Pizzas", "Bebidas", "Postres", "Promos"];
const COMMERCE_EMOJIS = ["🍔", "🍕", "🌮", "🍜", "🥗", "🧋", "🍣"];

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const { zoneName, allowed, validate } = useZoneStore();
  const router = useRouter();

  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user?.role === "dealer") { router.replace("/dealer"); return; }
    if (user?.role === "admin") { router.replace("/admin"); return; }

    // Auto-validar zona si tiene geolocation
    if (allowed === null && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => validate(pos.coords.latitude, pos.coords.longitude),
        () => {}
      );
    }

    api<{ commerces: Commerce[] }>("/commerces")
      .then((d) => setCommerces(d.commerces || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = commerces.filter((c) =>
    search ? c.name.toLowerCase().includes(search.toLowerCase()) || (c.description || "").toLowerCase().includes(search.toLowerCase()) : true
  );

  if (user?.role === "dealer" || user?.role === "admin") return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5] pb-24">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-[#25c462]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                <span>Entrega en</span>
              </div>
              <p className="font-bold text-sm text-gray-900 flex items-center gap-1">
                {zoneName || "Mi ubicación"}
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </button>
              {!user && (
                <button onClick={() => router.push("/login")} className="text-xs bg-[#25c462] text-white px-3 py-1.5 rounded-full font-semibold">Entrar</button>
              )}
            </div>
          </div>

          {/* Buscador */}
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]"
              placeholder="Buscar comercios o productos..."
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex-shrink-0 ${filter === f ? "bg-[#25c462] text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 space-y-4">
        {/* Zona no disponible */}
        {allowed === false && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
            <p className="text-red-600 text-sm font-medium">📍 Servicio no disponible en tu zona</p>
            <p className="text-red-400 text-xs mt-1">Por ahora solo operamos en zonas específicas</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-44 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-3">🏪</p>
            <p className="text-sm">No hay comercios disponibles</p>
          </div>
        ) : (
          filtered.map((commerce, i) => (
            <CommerceCard
              key={commerce.id}
              commerce={commerce}
              emoji={COMMERCE_EMOJIS[i % COMMERCE_EMOJIS.length]}
              onPress={() => router.push(`/comercio/${commerce.slug}`)}
            />
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function CommerceCard({ commerce, emoji, onPress }: { commerce: Commerce; emoji: string; onPress: () => void }) {
  return (
    <div
      onClick={onPress}
      className="bg-white rounded-3xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
    >
      {/* Banner */}
      <div className="relative h-44 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
        {commerce.banner_url ? (
          <img src={commerce.banner_url} alt={commerce.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center gap-4 opacity-30">
            {[emoji, emoji, emoji].map((e, i) => (
              <span key={i} className={`text-6xl ${i === 1 ? "text-8xl" : "text-5xl"}`}>{e}</span>
            ))}
          </div>
        )}

        {/* Badge estado */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold ${commerce.is_open ? "bg-[#25c462] text-white" : "bg-red-500 text-white"}`}>
          {commerce.is_open ? "ABIERTO" : "CERRADO"}
        </div>

        {/* Logo flotante */}
        <div className="absolute -bottom-5 left-4 w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center text-3xl border border-gray-100">
          {commerce.logo_url ? (
            <img src={commerce.logo_url} alt={commerce.name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <span>{emoji}</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="pt-8 pb-4 px-4">
        <h2 className="font-bold text-gray-900 text-lg leading-tight">{commerce.name}</h2>
        {commerce.description && (
          <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{commerce.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1">
            <span>📍</span> {commerce.city}
          </span>
          <span className="flex items-center gap-1">
            <span>⏱</span> {commerce.avg_delivery_time}
          </span>
          <span className="flex items-center gap-1">
            <span>🛵</span> {Number(commerce.delivery_fee) === 0 ? "Gratis" : `$${Number(commerce.delivery_fee).toLocaleString("es-CO")}`}
          </span>
          <span className="flex items-center gap-1">
            <span>⭐</span> {Number(commerce.rating).toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
