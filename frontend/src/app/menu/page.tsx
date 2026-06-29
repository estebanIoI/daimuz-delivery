"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { useZoneStore } from "@/stores/zoneStore";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { LocationModal } from "@/components/LocationModal";

interface Category {
  id: string;
  name: string;
  image_url: string | null;
  product_count: number;
}

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_available: number;
}

export default function MenuPage() {
  const user = useAuthStore((s) => s.user);
  const addItem = useCartStore((s) => s.addItem);
  const allowed = useZoneStore((s) => s.allowed);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [addedMsg, setAddedMsg] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (user?.role === "dealer") {
      router.push("/dealer");
      return;
    }
    if (user?.role === "admin") {
      router.push("/admin");
      return;
    }
    loadCategories();
  }, [user, router]);

  const loadCategories = async () => {
    try {
      const data = await api<{ categories: Category[] }>("/categories");
      setCategories(data.categories);
      if (data.categories.length > 0) {
        setActiveCategory(data.categories[0].id);
        loadProducts(data.categories[0].id);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (categoryId: string) => {
    try {
      const data = await api<{ products: Product[] }>(`/categories/${categoryId}/products`);
      setProducts(data.products.map((p) => ({ ...p, price: Number(p.price) })));
    } catch {
      // ignore
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    loadProducts(categoryId);
  };

  const handleAddToCart = (product: Product) => {
    if (!allowed) {
      setPendingProduct(product);
      setShowLocationModal(true);
      return;
    }
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url || undefined,
    });
    setAddedMsg(`${product.name} agregado`);
    setTimeout(() => setAddedMsg(""), 1500);
  };

  const handleLocationConfirmed = () => {
    setShowLocationModal(false);
    if (pendingProduct && allowed) {
      addItem({
        product_id: pendingProduct.id,
        name: pendingProduct.name,
        price: pendingProduct.price,
        image_url: pendingProduct.image_url || undefined,
      });
      setAddedMsg(`${pendingProduct.name} agregado`);
      setTimeout(() => setAddedMsg(""), 1500);
    }
    setPendingProduct(null);
  };

  if (user?.role === "dealer" || user?.role === "admin") return null;

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Navbar />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando menú...</div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat.id
                      ? "bg-[#ff6b35] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center text-4xl">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      "🍔"
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm text-gray-900 truncate">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-[#ff6b35]">
                        ${product.price.toFixed(0)}
                      </span>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="bg-[#ff6b35] text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-[#e55a2b] transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {products.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400">
                No hay productos en esta categoría
              </div>
            )}
          </>
        )}

        {addedMsg && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm z-50">
            {addedMsg}
          </div>
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
