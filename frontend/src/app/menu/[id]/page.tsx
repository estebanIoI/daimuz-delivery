"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { useZoneStore } from "@/stores/zoneStore";
import { api } from "@/lib/api";
import { LocationModal } from "@/components/LocationModal";

interface Product { id: string; category_id: string; name: string; description: string; price: number; image_url: string | null; is_available: number; }

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const addItem = useCartStore((s) => s.addItem);
  const { allowed } = useZoneStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  useEffect(() => {
    api<{ product: Product }>(`/products/${id}`)
      .then((d) => setProduct({ ...d.product, price: Number(d.product.price) }))
      .catch(() => router.push("/menu"));
  }, [id]);

  const handleAdd = () => {
    if (!allowed) { setShowLocation(true); return; }
    doAdd();
  };

  const doAdd = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem({ product_id: product.id, name: product.name, price: product.price, image_url: product.image_url || undefined });
    }
    setAdded(true);
    setTimeout(() => { setAdded(false); router.push("/menu"); }, 1000);
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#25c462] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const total = product.price * quantity;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Imagen hero */}
      <div className="relative w-full aspect-square bg-gray-100 flex items-center justify-center text-8xl max-h-72">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span>🍔</span>
        )}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>

      {/* Info */}
      <div className="flex-1 px-5 pt-5 pb-32">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight flex-1 pr-4">{product.name}</h1>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">${product.price.toLocaleString("es-CO")}</p>
          </div>
        </div>

        {product.description && (
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">{product.description}</p>
        )}

        {/* Cantidad */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Cantidad</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#25c462] hover:text-[#25c462] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
            </button>
            <span className="text-xl font-bold w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#25c462] hover:text-[#25c462] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* CTA fijo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 shadow-lg">
        <button
          onClick={handleAdd}
          disabled={added}
          className={`w-full py-4 rounded-2xl font-semibold text-white text-base transition-all ${added ? "bg-green-400" : "bg-[#25c462] hover:bg-[#1aaa52] active:scale-[0.98]"}`}
        >
          {added ? "✓ Agregado al carrito" : `Agregar al carrito · $${total.toLocaleString("es-CO")}`}
        </button>
      </div>

      {showLocation && (
        <LocationModal
          onConfirmed={() => { setShowLocation(false); doAdd(); }}
          onClose={() => setShowLocation(false)}
        />
      )}
    </div>
  );
}
