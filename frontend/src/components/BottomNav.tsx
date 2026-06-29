"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";

export function BottomNav() {
  const user = useAuthStore((s) => s.user);
  const itemCount = useCartStore((s) => s.itemCount);
  const router = useRouter();

  if (!user) return null;
  if (user.role === "admin") return null;

  const isDealer = user.role === "dealer";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-14">
        {isDealer ? (
          <>
            <button onClick={() => router.push("/dealer")} className="flex flex-col items-center text-[#ff6b35]">
              <span className="text-xl">📋</span>
              <span className="text-xs">Pedidos</span>
            </button>
            <button onClick={() => router.push("/dealer")} className="flex flex-col items-center text-gray-500">
              <span className="text-xl">📊</span>
              <span className="text-xs">Historial</span>
            </button>
            <button onClick={() => router.push("/orders")} className="flex flex-col items-center text-gray-500">
              <span className="text-xl">👤</span>
              <span className="text-xs">Perfil</span>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => router.push("/menu")} className="flex flex-col items-center text-[#ff6b35]">
              <span className="text-xl">🍔</span>
              <span className="text-xs">Menú</span>
            </button>
            <button onClick={() => router.push("/cart")} className="flex flex-col items-center text-gray-500 relative">
              <span className="text-xl">🛒</span>
              <span className="text-xs">Carrito</span>
              {itemCount() > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#ff6b35] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount()}
                </span>
              )}
            </button>
            <button onClick={() => router.push("/orders")} className="flex flex-col items-center text-gray-500">
              <span className="text-xl">📦</span>
              <span className="text-xs">Pedidos</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
