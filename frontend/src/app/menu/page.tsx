"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { useZoneStore } from "@/stores/zoneStore";
import { api } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";
import { LocationModal } from "@/components/LocationModal";

interface Category { id: string; name: string; image_url: string | null; product_count: number; }
interface Product { id: string; category_id: string; name: string; description: string; price: number; image_url: string | null; is_available: number; }

const EMOJI: Record<string, string> = { Hamburguesas: "🍔", Pizzas: "🍕", Bebidas: "🥤", Postres: "🍰", Combos: "🍱", Pollos: "🍗", Ensaladas: "🥗" };

export default function MenuPage() {
  const user = useAuthStore((s) => s.user);
  const addItem = useCartStore((s) => s.addItem);
  const itemCount = useCartStore((s) => s.itemCount);
  const { allowed, zoneName } = useZoneStore();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (user?.role === "dealer") { router.push("/dealer"); return; }
    if (user?.role === "admin") { router.push("/admin"); return; }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    try {
      const catData = await api<{ categories: Category[] }>("/categories");
      const cats = catData.categories || [];
      setCategories(cats);

      const allP: Product[] = [];
      for (const cat of cats) {
        const pd = await api<{ products: Product[] }>(`/categories/${cat.id}/products`);
        allP.push(...(pd.products || []).map((p) => ({ ...p, price: Number(p.price) })));
      }
      setAllProducts(allP);
      setProducts(allP);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleCategoryClick = (id: string) => {
    setActiveCategory(id);
    setSearch("");
    if (id === "all") { setProducts(allProducts); return; }
    setProducts(allProducts.filter((p) => p.category_id === id));
  };

  const handleSearch = (q: string) => {
    setSearch(q);
    setActiveCategory("all");
    if (!q.trim()) { setProducts(allProducts); return; }
    setProducts(allProducts.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())));
  };

  const handleAdd = (product: Product) => {
    if (!allowed) {
      setPendingProduct(product);
      setShowLocationModal(true);
      return;
    }
    doAdd(product);
  };

  const doAdd = (product: Product) => {
    addItem({ product_id: product.id, name: product.name, price: product.price, image_url: product.image_url || undefined });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 800);
  };

  const handleLocationConfirmed = () => {
    setShowLocationModal(false);
    if (pendingProduct && allowed) doAdd(pendingProduct);
    setPendingProduct(null);
  };

  if (user?.role === "dealer" || user?.role === "admin") return null;

  const catName = categories.find((c) => c.id === activeCategory)?.name || "";

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5] pb-20">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-[#25c462]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                <span>Entrega en</span>
              </div>
              <p className="font-semibold text-sm text-gray-900">{zoneName || "Mi ubicación"} ▾</p>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <button onClick={() => router.push("/cart")} className="relative p-2">
                  <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  {itemCount() > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-[#25c462] text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">{itemCount()}</span>
                  )}
                </button>
              )}
              {!user && (
                <button onClick={() => router.push("/login")} className="text-xs bg-[#25c462] text-white px-3 py-1.5 rounded-full font-medium">Entrar</button>
              )}
            </div>
          </div>

          {/* Buscador */}
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]"
              placeholder="Buscar productos..."
            />
          </div>

          {/* Categorías pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => handleCategoryClick("all")}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeCategory === "all" ? "bg-[#25c462] text-white" : "bg-gray-100 text-gray-600"}`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeCategory === cat.id ? "bg-[#25c462] text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {EMOJI[cat.name] || "🍽"} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {search && (
              <p className="text-xs text-gray-500 mb-3">{products.length} resultado(s) para "{search}"</p>
            )}
            {!search && catName && activeCategory !== "all" && (
              <p className="text-sm font-bold text-gray-800 mb-3">{catName}</p>
            )}
            {!search && activeCategory === "all" && (
              <p className="text-sm font-bold text-gray-800 mb-3">Todo el menú</p>
            )}

            {/* Lista de productos - estilo horizontal card */}
            <div className="space-y-3">
              {products.map((product) => (
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
                      <span className="font-bold text-gray-900 text-sm">${Number(product.price).toLocaleString("es-CO")}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAdd(product); }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-lg font-light transition-all ${addedId === product.id ? "bg-green-400 scale-90" : "bg-[#25c462] hover:bg-[#1aaa52]"}`}
                      >
                        {addedId === product.id ? "✓" : "+"}
                      </button>
                    </div>
                  </div>
                  <div className="w-28 h-28 flex-shrink-0 bg-gray-100 flex items-center justify-center text-5xl">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{EMOJI[categories.find((c) => c.id === product.category_id)?.name || ""] || "🍽"}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-sm">No hay productos disponibles</p>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />

      {showLocationModal && (
        <LocationModal
          onConfirmed={handleLocationConfirmed}
          onClose={() => { setShowLocationModal(false); setPendingProduct(null); }}
        />
      )}
    </div>
  );
}
