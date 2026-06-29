"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Navbar } from "@/components/Navbar";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register({ email, password, name, phone: phone || undefined, role });
      router.push("/menu");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-sm w-full space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Crear cuenta</h2>
            <p className="text-gray-500 mt-1">Únete a DAIMUZ Delivery</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent"
                placeholder="Tu nombre"
                required
              />
            </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent"
                placeholder="+57 300 000 0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cuenta</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent bg-white"
              >
                <option value="customer">Cliente</option>
                <option value="dealer">Dealer / Repartidor</option>
              </select>
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
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <button onClick={() => router.push("/login")} className="text-[#ff6b35] font-medium">
              Iniciar sesión
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
