"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";

export default function CartPage() {
  const user = useAuthStore((s) => s.user);
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "customer") {
      router.push(user.role === "dealer" ? "/dealer" : "/admin");
      return;
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4">
        <h2 className="text-xl font-bold mb-4">Tu carrito</h2>

        {items.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-gray-400 text-lg">🛒</p>
            <p className="text-gray-500">Tu carrito está vacío</p>
            <button
              onClick={() => router.push("/menu")}
              className="bg-[#ff6b35] text-white px-6 py-2.5 rounded-xl hover:bg-[#e55a2b] transition-colors"
            >
              Ir al menú
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
              >
                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    "🍔"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{item.name}</h3>
                  <p className="text-[#ff6b35] font-bold text-sm">${(item.price * item.quantity).toFixed(0)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm hover:bg-gray-200"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="text-red-400 hover:text-red-600 text-sm ml-1"
                >
                  ✕
                </button>
              </div>
            ))}

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total</span>
                <span className="text-2xl font-bold text-[#ff6b35]">${total().toFixed(0)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={clearCart}
                className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Vaciar
              </button>
              <button
                onClick={() => router.push("/checkout")}
                className="flex-[2] bg-[#ff6b35] text-white py-3 rounded-xl font-medium hover:bg-[#e55a2b] transition-colors"
              >
                Continuar al pago
              </button>
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
