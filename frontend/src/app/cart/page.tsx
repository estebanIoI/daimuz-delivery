"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { BottomNav } from "@/components/BottomNav";

export default function CartPage() {
  const user = useAuthStore((s) => s.user);
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();
  const router = useRouter();

  const DELIVERY_FEE = 3900;

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5] pb-24">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1">
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="font-bold text-lg text-gray-900 flex-1">Mi Carrito</h1>
          {items.length > 0 && (
            <button onClick={clearCart} className="p-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="text-7xl">🛒</div>
            <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
            <button onClick={() => router.push("/menu")} className="bg-[#25c462] text-white px-8 py-3 rounded-2xl font-semibold hover:bg-[#1aaa52] transition-colors">
              Ver menú
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Items */}
            {items.map((item) => (
              <div key={item.product_id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    : "🍔"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">{item.name}</h3>
                  <p className="text-[#25c462] font-bold text-sm mt-0.5">${(item.price * item.quantity).toLocaleString("es-CO")}</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
                  <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 font-bold">−</button>
                  <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-[#25c462] font-bold">+</button>
                </div>
              </div>
            ))}

            {/* Resumen */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Resumen</h3>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>${total().toLocaleString("es-CO")}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Domicilio</span>
                <span>${DELIVERY_FEE.toLocaleString("es-CO")}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>${(total() + DELIVERY_FEE).toLocaleString("es-CO")}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CTA fijo */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 shadow-lg">
          <button
            onClick={() => user ? router.push("/checkout") : router.push("/login")}
            className="w-full bg-[#25c462] text-white py-4 rounded-2xl font-semibold text-base hover:bg-[#1aaa52] active:scale-[0.98] transition-all"
          >
            Ir a pagar · ${(total() + DELIVERY_FEE).toLocaleString("es-CO")}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
