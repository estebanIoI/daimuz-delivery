"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-[#ff6b35]">
          DAIMUZ
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href={user.role === "dealer" ? "/dealer" : user.role === "admin" ? "/admin" : "/menu"}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {user.role === "dealer" ? "Panel" : user.role === "admin" ? "Admin" : "Menú"}
              </Link>
              <Link href="/orders" className="text-sm text-gray-600 hover:text-gray-900">
                Pedidos
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
                Iniciar
              </Link>
              <Link
                href="/register"
                className="text-sm bg-[#ff6b35] text-white px-3 py-1.5 rounded-lg hover:bg-[#e55a2b]"
              >
                Registro
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
