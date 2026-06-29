"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";

type Tab = "dashboard" | "zones" | "menu" | "dealers" | "orders";

interface Zone { id: string; name: string; center_lat: number; center_lng: number; radius_km: number; is_active: number; }
interface Category { id: string; name: string; product_count: number; }
interface Product { id: string; category_id: string; name: string; price: number; is_available: number; description: string; }
interface Dealer { id: string; name: string; email: string; phone: string; is_active: number; dealerStats?: { completed_orders: number; rating_avg: number; xp: number; rank: string; }; }
interface Order { id: string; status: string; total: number; delivery_address: string; created_at: string; customer_id: string; }

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("dashboard");

  // Stats
  const [stats, setStats] = useState({ orders: 0, dealers: 0, products: 0, zones: 0 });

  // Zones
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneForm, setZoneForm] = useState({ name: "", center_lat: "", center_lng: "", radius_km: "" });
  const [zoneMsg, setZoneMsg] = useState("");
  const [creatingZone, setCreatingZone] = useState(false);

  // Menu
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catForm, setCatForm] = useState({ name: "" });
  const [prodForm, setProdForm] = useState({ category_id: "", name: "", description: "", price: "" });
  const [menuMsg, setMenuMsg] = useState("");
  const [creatingMenu, setCreatingMenu] = useState(false);

  // Dealers
  const [dealers, setDealers] = useState<Dealer[]>([]);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "admin") { router.push(user.role === "dealer" ? "/dealer" : "/menu"); return; }
    loadDashboard();
  }, [user, router]);

  const loadDashboard = useCallback(async () => {
    try {
      const [ordersData, zonesData, productsData] = await Promise.all([
        api<{ orders: Order[] }>("/orders"),
        api<{ zones: Zone[] }>("/zones"),
        api<{ products: Product[] }>("/products"),
      ]);
      const allOrders = ordersData.orders || [];
      const allZones = zonesData.zones || [];
      const allProducts = productsData.products || [];
      setOrders(allOrders);
      setZones(allZones);
      setProducts(allProducts.map((p) => ({ ...p, price: Number(p.price) })));
      setStats({ orders: allOrders.length, dealers: 0, products: allProducts.length, zones: allZones.length });
    } catch { /* ignore */ }
  }, []);

  const loadTab = useCallback(async (t: Tab) => {
    setTab(t);
    if (t === "zones") {
      const data = await api<{ zones: Zone[] }>("/zones");
      setZones(data.zones || []);
    }
    if (t === "menu") {
      const [catData, prodData] = await Promise.all([
        api<{ categories: Category[] }>("/categories"),
        api<{ products: Product[] }>("/products"),
      ]);
      setCategories(catData.categories || []);
      setProducts((prodData.products || []).map((p) => ({ ...p, price: Number(p.price) })));
    }
    if (t === "dealers") {
      try {
        const data = await api<{ users: Dealer[] }>("/users/dealers");
        setDealers(data.users || []);
      } catch { setDealers([]); }
    }
    if (t === "orders") {
      const data = await api<{ orders: Order[] }>("/orders");
      setOrders(data.orders || []);
    }
  }, []);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingZone(true); setZoneMsg("");
    try {
      await api("/zones", { method: "POST", body: { name: zoneForm.name, center_lat: parseFloat(zoneForm.center_lat), center_lng: parseFloat(zoneForm.center_lng), radius_km: parseFloat(zoneForm.radius_km) } });
      setZoneMsg("✅ Zona creada");
      setZoneForm({ name: "", center_lat: "", center_lng: "", radius_km: "" });
      const data = await api<{ zones: Zone[] }>("/zones");
      setZones(data.zones || []);
    } catch (err: unknown) { setZoneMsg(err instanceof Error ? err.message : "Error"); }
    finally { setCreatingZone(false); }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm("¿Eliminar esta zona?")) return;
    await api(`/zones/${id}`, { method: "DELETE" });
    setZones((z) => z.filter((x) => x.id !== id));
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingMenu(true); setMenuMsg("");
    try {
      await api("/categories", { method: "POST", body: { name: catForm.name } });
      setMenuMsg("✅ Categoría creada");
      setCatForm({ name: "" });
      const data = await api<{ categories: Category[] }>("/categories");
      setCategories(data.categories || []);
    } catch (err: unknown) { setMenuMsg(err instanceof Error ? err.message : "Error"); }
    finally { setCreatingMenu(false); }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingMenu(true); setMenuMsg("");
    try {
      await api("/products", { method: "POST", body: { category_id: prodForm.category_id, name: prodForm.name, description: prodForm.description, price: parseFloat(prodForm.price) } });
      setMenuMsg("✅ Producto creado");
      setProdForm({ category_id: "", name: "", description: "", price: "" });
      const data = await api<{ products: Product[] }>("/products");
      setProducts((data.products || []).map((p) => ({ ...p, price: Number(p.price) })));
    } catch (err: unknown) { setMenuMsg(err instanceof Error ? err.message : "Error"); }
    finally { setCreatingMenu(false); }
  };

  const handleToggleProduct = async (p: Product) => {
    await api(`/products/${p.id}`, { method: "PUT", body: { ...p, is_available: p.is_available ? 0 : 1 } });
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_available: x.is_available ? 0 : 1 } : x));
  };

  const statusLabel: Record<string, string> = { pending: "Pendiente", accepted: "Aceptado", picked_up: "Recogido", in_transit: "En camino", delivered: "Entregado", cancelled: "Cancelado" };
  const statusColor: Record<string, string> = { pending: "bg-yellow-100 text-yellow-700", accepted: "bg-blue-100 text-blue-700", picked_up: "bg-purple-100 text-purple-700", in_transit: "bg-indigo-100 text-indigo-700", delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700" };
  const rankColor: Record<string, string> = { Bronze: "text-amber-700", Silver: "text-gray-500", Gold: "text-yellow-500", Elite: "text-purple-600" };

  if (!user || user.role !== "admin") return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "zones", label: "Zonas" },
    { key: "menu", label: "Menú" },
    { key: "dealers", label: "Dealers" },
    { key: "orders", label: "Pedidos" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4">
        <h2 className="text-xl font-bold mb-4">Panel de administración</h2>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white rounded-xl p-1 shadow-sm border border-gray-100 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => loadTab(t.key)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === t.key ? "bg-[#ff6b35] text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Pedidos", value: stats.orders },
                { label: "Productos", value: stats.products },
                { label: "Zonas activas", value: stats.zones },
                { label: "Dealers", value: stats.dealers },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <p className="text-2xl font-bold text-[#ff6b35]">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
              <p className="font-semibold text-sm text-gray-700">Acciones rápidas</p>
              <button onClick={() => loadTab("zones")} className="w-full text-left text-sm py-2 px-3 rounded-lg hover:bg-gray-50 border border-gray-100">📍 Gestionar zonas de delivery</button>
              <button onClick={() => loadTab("menu")} className="w-full text-left text-sm py-2 px-3 rounded-lg hover:bg-gray-50 border border-gray-100">🍔 Gestionar menú</button>
              <button onClick={() => loadTab("dealers")} className="w-full text-left text-sm py-2 px-3 rounded-lg hover:bg-gray-50 border border-gray-100">🛵 Ver dealers</button>
              <button onClick={() => loadTab("orders")} className="w-full text-left text-sm py-2 px-3 rounded-lg hover:bg-gray-50 border border-gray-100">📋 Ver pedidos</button>
            </div>
          </div>
        )}

        {/* ZONAS */}
        {tab === "zones" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold mb-3 text-sm">Nueva zona de delivery</h3>
              <form onSubmit={handleCreateZone} className="space-y-3">
                <input value={zoneForm.name} onChange={(e) => setZoneForm((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]" placeholder="Nombre (ej: Mocoa Centro)" required />
                <div className="flex gap-2">
                  <input type="number" step="any" value={zoneForm.center_lat} onChange={(e) => setZoneForm((p) => ({ ...p, center_lat: e.target.value }))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]" placeholder="Latitud" required />
                  <input type="number" step="any" value={zoneForm.center_lng} onChange={(e) => setZoneForm((p) => ({ ...p, center_lng: e.target.value }))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]" placeholder="Longitud" required />
                </div>
                <input type="number" step="0.1" min="0.1" value={zoneForm.radius_km} onChange={(e) => setZoneForm((p) => ({ ...p, radius_km: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]" placeholder="Radio en KM (ej: 5.0)" required />
                <button type="submit" disabled={creatingZone} className="w-full bg-[#ff6b35] text-white py-2.5 rounded-xl font-medium hover:bg-[#e55a2b] disabled:opacity-50">
                  {creatingZone ? "Creando..." : "Crear zona"}
                </button>
              </form>
              {zoneMsg && <p className={`text-sm mt-2 ${zoneMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{zoneMsg}</p>}
            </div>

            <div className="space-y-2">
              {zones.length === 0 && <p className="text-center text-gray-400 text-sm py-6">No hay zonas configuradas</p>}
              {zones.map((z) => (
                <div key={z.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{z.name}</p>
                    <p className="text-xs text-gray-400">{Number(z.center_lat).toFixed(4)}, {Number(z.center_lng).toFixed(4)} · Radio: {Number(z.radius_km).toFixed(1)} km</p>
                  </div>
                  <button onClick={() => handleDeleteZone(z.id)} className="text-red-400 hover:text-red-600 text-sm px-3 py-1 rounded-lg hover:bg-red-50">Eliminar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MENÚ */}
        {tab === "menu" && (
          <div className="space-y-4">
            {menuMsg && <p className={`text-sm ${menuMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{menuMsg}</p>}

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold mb-3 text-sm">Nueva categoría</h3>
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input value={catForm.name} onChange={(e) => setCatForm({ name: e.target.value })} className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]" placeholder="Nombre de categoría" required />
                <button type="submit" disabled={creatingMenu} className="bg-[#ff6b35] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#e55a2b] disabled:opacity-50">Crear</button>
              </form>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold mb-3 text-sm">Nuevo producto</h3>
              <form onSubmit={handleCreateProduct} className="space-y-3">
                <select value={prodForm.category_id} onChange={(e) => setProdForm((p) => ({ ...p, category_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]" required>
                  <option value="">Seleccionar categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input value={prodForm.name} onChange={(e) => setProdForm((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]" placeholder="Nombre del producto" required />
                <input value={prodForm.description} onChange={(e) => setProdForm((p) => ({ ...p, description: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]" placeholder="Descripción" />
                <input type="number" step="any" value={prodForm.price} onChange={(e) => setProdForm((p) => ({ ...p, price: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b35]" placeholder="Precio (ej: 18900)" required />
                <button type="submit" disabled={creatingMenu} className="w-full bg-[#ff6b35] text-white py-2.5 rounded-xl font-medium hover:bg-[#e55a2b] disabled:opacity-50">
                  {creatingMenu ? "Creando..." : "Crear producto"}
                </button>
              </form>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-600">{products.length} productos</p>
              {products.map((p) => (
                <div key={p.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${!p.is_available ? "line-through text-gray-400" : ""}`}>{p.name}</p>
                    <p className="text-xs text-gray-400">${p.price.toLocaleString()}</p>
                  </div>
                  <button onClick={() => handleToggleProduct(p)} className={`ml-2 text-xs px-3 py-1 rounded-full font-medium ${p.is_available ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                    {p.is_available ? "Activo" : "Inactivo"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEALERS */}
        {tab === "dealers" && (
          <div className="space-y-3">
            {dealers.length === 0 && <p className="text-center text-gray-400 text-sm py-10">No hay dealers registrados</p>}
            {dealers.map((d) => (
              <div key={d.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{d.name}</p>
                    <p className="text-xs text-gray-400">{d.email}</p>
                  </div>
                  {d.dealerStats && (
                    <span className={`text-xs font-bold ${rankColor[d.dealerStats.rank] || "text-gray-500"}`}>
                      {d.dealerStats.rank}
                    </span>
                  )}
                </div>
                {d.dealerStats && (
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>🎯 {d.dealerStats.completed_orders} entregas</span>
                    <span>⭐ {Number(d.dealerStats.rating_avg).toFixed(1)}</span>
                    <span>✨ {d.dealerStats.xp} XP</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ORDERS */}
        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 && <p className="text-center text-gray-400 text-sm py-10">No hay pedidos aún</p>}
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-[#ff6b35]/40 transition-colors" onClick={() => router.push(`/orders/${o.id}`)}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-400 font-mono">{o.id.slice(0, 8)}…</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[o.status] || "bg-gray-100 text-gray-500"}`}>{statusLabel[o.status] || o.status}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{o.delivery_address}</p>
                <p className="text-sm font-bold text-[#ff6b35] mt-1">${Number(o.total).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
