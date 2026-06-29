"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Navbar } from "@/components/Navbar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/menu");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-sm w-full space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Iniciar sesión</h2>
            <p className="text-gray-500 mt-1">Ingresa a tu cuenta DAIMUZ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent"
                placeholder="••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff6b35] text-white py-3 rounded-xl font-medium hover:bg-[#e55a2b] disabled:opacity-50 transition-colors"
            >
              {loading ? "Iniciando..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            ¿No tienes cuenta?{" "}
            <button onClick={() => router.push("/register")} className="text-[#ff6b35] font-medium">
              Registrate
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
