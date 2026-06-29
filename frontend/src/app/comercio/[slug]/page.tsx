"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useZoneStore } from "@/stores/zoneStore";
import { api } from "@/lib/api";
import { LocationModal } from "@/components/LocationModal";

interface Commerce { id: string; slug: string; name: string; description: string; logo_url: string | null; banner_url: string | null; is_open: number; avg_delivery_time: string; delivery_fee: number; rating: number; city: string; }
interface Category { id: string; name: string; }
interface Product { id: string; category_id: string; name: string; description: string; price: number; image_url: string | null; is_available: number; }

const EMOJI: Record<string, string> = { Hamburguesas: "🍔", Pizzas: "🍕", Bebidas: "🥤", Postres: "🍰", Combos: "🍱", Pollos: "🍗", Ensaladas: "🥗", Malteadas: "🥛", Helados: "🍦" };

export default function ComercioPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const { allowed } = useZoneStore();

  const [commerce, setCommerce] = useState<Commerce | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [addedId, setAddedId] = useState<string | null>(null);
  const [showLocation, setShowLocation] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    api<{ commerce: Commerce; categories: Category[]; products: Product[] }>(`/commerces/${slug}`)
      .then((d) => {
        setCommerce(d.commerce);
        setCategories(d.categories || []);
        setProducts(d.products || []);
      })
      .catch(() => router.push("/"));
  }, [slug]);

  const filteredProducts = activeCategory === "all"
    ? products
    : products.filter((p) => p.category_id === activeCategory);

  const handleAdd = (product: Product) => {
    if (!allowed) { setPendingProduct(product); setShowLocation(true); return; }
    doAdd(product);
  };

  const doAdd = (product: Product) => {
    addItem({ product_id: product.id, name: product.name, price: product.price, image_url: product.image_url || undefined });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 700);
  };

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = total();

  if (!commerce) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="w-8 h-8 border-2 border-[#25c462] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]" style={{ paddingBottom: cartCount > 0 ? "6rem" : "2rem" }}>
      {/* Hero */}
      <div className="relative h-52 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        {commerce.banner_url ? (
          <img src={commerce.banner_url} alt={commerce.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20 text-9xl">🍔</div>
        )}

        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold ${commerce.is_open ? "bg-[#25c462] text-white" : "bg-red-500 text-white"}`}>
          {commerce.is_open ? "ABIERTO" : "CERRADO"}
        </div>
      </div>

      {/* Info del comercio */}
      <div className="bg-white shadow-sm relative">
        <div className="max-w-lg mx-auto px-4 pt-2 pb-3">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 -mt-8 bg-white rounded-2xl shadow-lg flex items-center justify-center text-3xl border border-gray-100 flex-shrink-0 overflow-hidden">
              {commerce.logo_url
                ? <img src={commerce.logo_url} alt={commerce.name} className="w-full h-full object-cover rounded-2xl" />
                : <span>🍔</span>}
            </div>
            <div className="flex-1 pt-1">
              <h1 className="font-bold text-gray-900 text-xl leading-tight">{commerce.name}</h1>
              {commerce.description && <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{commerce.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
            <span>⏱ {commerce.avg_delivery_time}</span>
            <span>🛵 {Number(commerce.delivery_fee) === 0 ? "Gratis" : `$${Number(commerce.delivery_fee).toLocaleString("es-CO")}`}</span>
            <span>⭐ {Number(commerce.rating).toFixed(1)}</span>
            <span>📍 {commerce.city}</span>
          </div>
        </div>

        {/* Categorías sticky */}
        <div className="border-t border-gray-100">
          <div className="max-w-lg mx-auto flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory("all")}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-colors ${activeCategory === "all" ? "bg-[#25c462] text-white" : "bg-gray-100 text-gray-600"}`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-colors ${activeCategory === cat.id ? "bg-[#25c462] text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {EMOJI[cat.name] || "🍽"} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Productos */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🍽</p>
            <p className="text-sm">No hay productos en esta categoría</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm flex items-center cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => router.push(`/menu/${product.id}`)}
            >
              <div className="flex-1 p-4">
                <h3 className="font-semibold text-sm text-gray-900 leading-tight">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{product.description}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-gray-900 text-sm">${product.price.toLocaleString("es-CO")}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAdd(product); }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-lg font-light transition-all ${addedId === product.id ? "bg-green-400 scale-90" : "bg-[#25c462] hover:bg-[#1aaa52]"}`}
                  >
                    {addedId === product.id ? "✓" : "+"}
                  </button>
                </div>
              </div>
              <div className="w-28 h-28 flex-shrink-0 bg-gray-100 flex items-center justify-center text-5xl overflow-hidden">
                {product.image_url
                  ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                  : <span>{EMOJI[categories.find((c) => c.id === product.category_id)?.name || ""] || "🍽"}</span>}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Floating Cart CTA */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-transparent z-50">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => user ? router.push("/cart") : router.push("/login")}
              className="w-full bg-[#25c462] text-white py-4 rounded-2xl font-semibold flex items-center justify-between px-5 shadow-xl hover:bg-[#1aaa52] active:scale-[0.98] transition-all"
            >
              <span className="bg-white/20 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">{cartCount}</span>
              <span className="text-base">Ver carrito</span>
              <span className="font-bold">${cartTotal.toLocaleString("es-CO")}</span>
            </button>
          </div>
        </div>
      )}

      {showLocation && (
        <LocationModal
          onConfirmed={() => { setShowLocation(false); if (pendingProduct) doAdd(pendingProduct); setPendingProduct(null); }}
          onClose={() => { setShowLocation(false); setPendingProduct(null); }}
        />
      )}
    </div>
  );
}
