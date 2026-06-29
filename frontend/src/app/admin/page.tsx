"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { ImageUpload } from "@/components/ImageUpload";

type Tab = "dashboard" | "zones" | "commerces" | "dealers" | "orders" | "settings";

interface Zone { id: string; name: string; center_lat: number; center_lng: number; radius_km: number; is_active: number; }
interface Category { id: string; name: string; product_count: number; }
interface Product { id: string; commerce_id: string | null; category_id: string; name: string; price: number; is_available: number; description: string; image_url: string | null; sort_order?: number; }
interface Dealer { id: string; name: string; email: string; phone: string; is_active: number; dealerStats?: { completed_orders: number; rating_avg: number; xp: number; rank: string; }; }
interface Order { id: string; status: string; total: number; delivery_address: string; created_at: string; customer_id: string; }
interface Commerce { id: string; slug: string; name: string; description: string; logo_url: string | null; banner_url: string | null; city: string; is_open: number; avg_delivery_time: string; delivery_fee: number; rating: number; product_count: number; }

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("dashboard");

  const [stats, setStats] = useState({ orders: 0, dealers: 0, products: 0, zones: 0, commerces: 0 });

  // Zones
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneForm, setZoneForm] = useState({ name: "", center_lat: "", center_lng: "", radius_km: "" });
  const [zoneMsg, setZoneMsg] = useState("");
  const [creatingZone, setCreatingZone] = useState(false);

  // Commerces
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [selectedCommerce, setSelectedCommerce] = useState<Commerce | null>(null);
  const [showCommerceForm, setShowCommerceForm] = useState(false);
  const [commerceForm, setCommerceForm] = useState({ name: "", description: "", city: "Mocoa", delivery_fee: "3900", avg_delivery_time: "30-40 min", logo_url: "", banner_url: "" });
  const [commerceMsg, setCommerceMsg] = useState("");
  const [savingCommerce, setSavingCommerce] = useState(false);
  const [editCommerce, setEditCommerce] = useState<Commerce | null>(null);

  // Menú del comercio seleccionado
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catForm, setCatForm] = useState({ name: "" });
  const [prodForm, setProdForm] = useState({ category_id: "", name: "", description: "", price: "", image_url: "" });
  const [menuMsg, setMenuMsg] = useState("");
  const [creatingMenu, setCreatingMenu] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  // Settings (Cloudinary)
  const [cloudForm, setCloudForm] = useState({ cloud_name: "", api_key: "", api_secret: "" });
  const [cloudStatus, setCloudStatus] = useState({ has_secret: false, enabled: false });
  const [cloudMsg, setCloudMsg] = useState("");
  const [savingCloud, setSavingCloud] = useState(false);

  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "admin") { router.push(user.role === "dealer" ? "/dealer" : "/"); return; }
    loadDashboard();
  }, [user, router]);

  const loadDashboard = useCallback(async () => {
    try {
      const [ordersData, zonesData, productsData, commercesData] = await Promise.all([
        api<{ orders: Order[] }>("/orders"),
        api<{ zones: Zone[] }>("/zones"),
        api<{ products: Product[] }>("/products"),
        api<{ commerces: Commerce[] }>("/commerces"),
      ]);
      setOrders(ordersData.orders || []);
      setZones(zonesData.zones || []);
      setStats({
        orders: (ordersData.orders || []).length,
        dealers: 0,
        products: (productsData.products || []).length,
        zones: (zonesData.zones || []).length,
        commerces: (commercesData.commerces || []).length,
      });
    } catch { /* ignore */ }
  }, []);

  const loadCommerces = useCallback(async () => {
    const data = await api<{ commerces: Commerce[] }>("/commerces");
    setCommerces(data.commerces || []);
  }, []);

  const loadCommerceMenu = useCallback(async (commerceId: string) => {
    const [catData, prodData] = await Promise.all([
      api<{ categories: Category[] }>(`/categories?commerce_id=${commerceId}`),
      api<{ products: Product[] }>(`/products?commerce_id=${commerceId}&all=1`),
    ]);
    setCategories(catData.categories || []);
    setProducts((prodData.products || []).map((p) => ({ ...p, price: Number(p.price) })));
  }, []);

  const loadTab = useCallback(async (t: Tab) => {
    setTab(t);
    setSelectedCommerce(null);
    if (t === "zones") setZones((await api<{ zones: Zone[] }>("/zones")).zones || []);
    if (t === "commerces") await loadCommerces();
    if (t === "dealers") {
      try { setDealers((await api<{ users: Dealer[] }>("/users/dealers")).users || []); } catch { setDealers([]); }
    }
    if (t === "orders") setOrders((await api<{ orders: Order[] }>("/orders")).orders || []);
    if (t === "settings") {
      try {
        const c = await api<{ cloud_name: string; api_key: string; has_secret: boolean; enabled: boolean }>("/settings/cloudinary");
        setCloudForm({ cloud_name: c.cloud_name, api_key: c.api_key, api_secret: "" });
        setCloudStatus({ has_secret: c.has_secret, enabled: c.enabled });
      } catch { /* ignore */ }
    }
  }, [loadCommerces]);

  // ---- Zonas ----
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingZone(true); setZoneMsg("");
    try {
      await api("/zones", { method: "POST", body: { name: zoneForm.name, center_lat: parseFloat(zoneForm.center_lat), center_lng: parseFloat(zoneForm.center_lng), radius_km: parseFloat(zoneForm.radius_km) } });
      setZoneMsg("✅ Zona creada");
      setZoneForm({ name: "", center_lat: "", center_lng: "", radius_km: "" });
      setZones((await api<{ zones: Zone[] }>("/zones")).zones || []);
    } catch (err) { setZoneMsg(err instanceof Error ? err.message : "Error"); }
    finally { setCreatingZone(false); }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm("¿Eliminar esta zona?")) return;
    await api(`/zones/${id}`, { method: "DELETE" });
    setZones((z) => z.filter((x) => x.id !== id));
  };

  // ---- Comercios ----
  const handleSaveCommerce = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCommerce(true); setCommerceMsg("");
    try {
      await api("/commerces", {
        method: "POST",
        body: {
          slug: slugify(commerceForm.name),
          name: commerceForm.name,
          description: commerceForm.description,
          city: commerceForm.city,
          delivery_fee: parseFloat(commerceForm.delivery_fee) || 0,
          avg_delivery_time: commerceForm.avg_delivery_time,
          logo_url: commerceForm.logo_url || null,
          banner_url: commerceForm.banner_url || null,
        },
      });
      setCommerceMsg("✅ Comercio creado");
      setCommerceForm({ name: "", description: "", city: "Mocoa", delivery_fee: "3900", avg_delivery_time: "30-40 min", logo_url: "", banner_url: "" });
      setShowCommerceForm(false);
      await loadCommerces();
    } catch (err) { setCommerceMsg(err instanceof Error ? err.message : "Error"); }
    finally { setSavingCommerce(false); }
  };

  const handleUpdateCommerce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCommerce) return;
    setSavingCommerce(true);
    try {
      await api(`/commerces/${editCommerce.id}`, {
        method: "PATCH",
        body: {
          name: editCommerce.name,
          description: editCommerce.description,
          city: editCommerce.city,
          delivery_fee: Number(editCommerce.delivery_fee) || 0,
          avg_delivery_time: editCommerce.avg_delivery_time,
          logo_url: editCommerce.logo_url,
          banner_url: editCommerce.banner_url,
        },
      });
      setEditCommerce(null);
      await loadCommerces();
      if (selectedCommerce && selectedCommerce.id === editCommerce.id) setSelectedCommerce(editCommerce);
    } catch { /* ignore */ }
    finally { setSavingCommerce(false); }
  };

  const handleToggleCommerce = async (c: Commerce) => {
    const newVal = c.is_open ? 0 : 1;
    await api(`/commerces/${c.id}`, { method: "PATCH", body: { is_open: newVal } });
    setCommerces((prev) => prev.map((x) => x.id === c.id ? { ...x, is_open: newVal } : x));
  };

  const handleDeleteCommerce = async (c: Commerce) => {
    if (!confirm(`¿Eliminar "${c.name}" y sus productos?`)) return;
    await api(`/commerces/${c.id}`, { method: "DELETE" });
    setCommerces((prev) => prev.filter((x) => x.id !== c.id));
  };

  const openCommerce = async (c: Commerce) => {
    setSelectedCommerce(c);
    setMenuMsg("");
    setProdForm({ category_id: "", name: "", description: "", price: "", image_url: "" });
    await loadCommerceMenu(c.id);
  };

  // ---- Menú del comercio ----
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommerce) return;
    setCreatingMenu(true); setMenuMsg("");
    try {
      await api("/categories", { method: "POST", body: { name: catForm.name, commerce_id: selectedCommerce.id } });
      setMenuMsg("✅ Categoría creada");
      setCatForm({ name: "" });
      await loadCommerceMenu(selectedCommerce.id);
    } catch (err) { setMenuMsg(err instanceof Error ? err.message : "Error"); }
    finally { setCreatingMenu(false); }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommerce) return;
    setCreatingMenu(true); setMenuMsg("");
    try {
      await api("/products", {
        method: "POST",
        body: {
          commerce_id: selectedCommerce.id,
          category_id: prodForm.category_id,
          name: prodForm.name,
          description: prodForm.description,
          price: parseFloat(prodForm.price),
          image_url: prodForm.image_url || null,
        },
      });
      setMenuMsg("✅ Producto creado");
      setProdForm({ category_id: "", name: "", description: "", price: "", image_url: "" });
      await loadCommerceMenu(selectedCommerce.id);
    } catch (err) { setMenuMsg(err instanceof Error ? err.message : "Error"); }
    finally { setCreatingMenu(false); }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    setCreatingMenu(true);
    try {
      await api(`/products/${editProduct.id}`, {
        method: "PUT",
        body: {
          commerce_id: editProduct.commerce_id,
          category_id: editProduct.category_id,
          name: editProduct.name,
          description: editProduct.description,
          price: Number(editProduct.price),
          image_url: editProduct.image_url,
          is_available: editProduct.is_available,
          sort_order: editProduct.sort_order || 0,
        },
      });
      setEditProduct(null);
      if (selectedCommerce) await loadCommerceMenu(selectedCommerce.id);
    } catch { /* ignore */ }
    finally { setCreatingMenu(false); }
  };

  const handleToggleProduct = async (p: Product) => {
    await api(`/products/${p.id}`, { method: "PUT", body: { ...p, is_available: p.is_available ? 0 : 1 } });
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_available: x.is_available ? 0 : 1 } : x));
  };

  // ---- Cloudinary ----
  const handleSaveCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCloud(true); setCloudMsg("");
    try {
      const r = await api<{ enabled: boolean }>("/settings/cloudinary", {
        method: "PUT",
        body: { cloud_name: cloudForm.cloud_name, api_key: cloudForm.api_key, api_secret: cloudForm.api_secret || undefined },
      });
      setCloudStatus((s) => ({ has_secret: cloudForm.api_secret ? true : s.has_secret, enabled: r.enabled }));
      setCloudForm((f) => ({ ...f, api_secret: "" }));
      setCloudMsg(r.enabled ? "✅ Cloudinary activado" : "⚠️ Guardado, pero faltan datos para activar");
    } catch (err) { setCloudMsg(err instanceof Error ? err.message : "Error"); }
    finally { setSavingCloud(false); }
  };

  const statusLabel: Record<string, string> = { pending: "Pendiente", waiting_dealer: "Esperando dealer", accepted: "Aceptado", picked_up: "Recogido", in_transit: "En camino", delivered: "Entregado", cancelled: "Cancelado" };
  const statusColor: Record<string, string> = { pending: "bg-yellow-100 text-yellow-700", waiting_dealer: "bg-orange-100 text-orange-700", accepted: "bg-blue-100 text-blue-700", picked_up: "bg-purple-100 text-purple-700", in_transit: "bg-indigo-100 text-indigo-700", delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700" };
  const rankColor: Record<string, string> = { Bronze: "text-amber-700", Silver: "text-gray-500", Gold: "text-yellow-500", Elite: "text-purple-600" };

  if (!user || user.role !== "admin") return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "Inicio" },
    { key: "zones", label: "Zonas" },
    { key: "commerces", label: "Comercios" },
    { key: "dealers", label: "Dealers" },
    { key: "orders", label: "Pedidos" },
    { key: "settings", label: "Ajustes" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4">
        <h2 className="text-xl font-bold mb-4">Panel de administración</h2>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white rounded-xl p-1 shadow-sm border border-gray-100 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => loadTab(t.key)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === t.key ? "bg-[#25c462] text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Comercios", value: stats.commerces },
                { label: "Pedidos", value: stats.orders },
                { label: "Productos", value: stats.products },
                { label: "Zonas activas", value: stats.zones },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <p className="text-2xl font-bold text-[#25c462]">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
              <p className="font-semibold text-sm text-gray-700">Acciones rápidas</p>
              <button onClick={() => loadTab("commerces")} className="w-full text-left text-sm py-2 px-3 rounded-lg hover:bg-gray-50 border border-gray-100">🏪 Gestionar comercios y productos</button>
              <button onClick={() => loadTab("zones")} className="w-full text-left text-sm py-2 px-3 rounded-lg hover:bg-gray-50 border border-gray-100">📍 Gestionar zonas de delivery</button>
              <button onClick={() => loadTab("settings")} className="w-full text-left text-sm py-2 px-3 rounded-lg hover:bg-gray-50 border border-gray-100">⚙️ Configurar Cloudinary</button>
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
                <input value={zoneForm.name} onChange={(e) => setZoneForm((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Nombre (ej: Mocoa Centro)" required />
                <div className="flex gap-2">
                  <input type="number" step="any" value={zoneForm.center_lat} onChange={(e) => setZoneForm((p) => ({ ...p, center_lat: e.target.value }))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Latitud" required />
                  <input type="number" step="any" value={zoneForm.center_lng} onChange={(e) => setZoneForm((p) => ({ ...p, center_lng: e.target.value }))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Longitud" required />
                </div>
                <input type="number" step="0.1" min="0.1" value={zoneForm.radius_km} onChange={(e) => setZoneForm((p) => ({ ...p, radius_km: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Radio en KM (ej: 5.0)" required />
                <button type="submit" disabled={creatingZone} className="w-full bg-[#25c462] text-white py-2.5 rounded-xl font-medium hover:bg-[#1aaa52] disabled:opacity-50">{creatingZone ? "Creando..." : "Crear zona"}</button>
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

        {/* COMERCIOS - lista */}
        {tab === "commerces" && !selectedCommerce && (
          <div className="space-y-4">
            {!showCommerceForm ? (
              <button onClick={() => { setShowCommerceForm(true); setCommerceMsg(""); }} className="w-full bg-[#25c462] text-white py-3 rounded-xl font-semibold hover:bg-[#1aaa52]">+ Nuevo comercio</button>
            ) : (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">Nuevo comercio</h3>
                  <button onClick={() => setShowCommerceForm(false)} className="text-gray-400 text-sm">Cancelar</button>
                </div>
                <form onSubmit={handleSaveCommerce} className="space-y-3">
                  <input value={commerceForm.name} onChange={(e) => setCommerceForm((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Nombre (ej: Jugos Mocoa)" required />
                  {commerceForm.name && <p className="text-[11px] text-gray-400">URL: /comercio/{slugify(commerceForm.name)}</p>}
                  <input value={commerceForm.description} onChange={(e) => setCommerceForm((p) => ({ ...p, description: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Descripción corta" />
                  <div className="flex gap-2">
                    <input value={commerceForm.city} onChange={(e) => setCommerceForm((p) => ({ ...p, city: e.target.value }))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Ciudad" />
                    <input type="number" value={commerceForm.delivery_fee} onChange={(e) => setCommerceForm((p) => ({ ...p, delivery_fee: e.target.value }))} className="w-32 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Domicilio $" />
                  </div>
                  <input value={commerceForm.avg_delivery_time} onChange={(e) => setCommerceForm((p) => ({ ...p, avg_delivery_time: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Tiempo estimado (ej: 25-35 min)" />
                  <div className="flex gap-4">
                    <div className="w-24"><ImageUpload value={commerceForm.logo_url} onChange={(url) => setCommerceForm((p) => ({ ...p, logo_url: url }))} label="Logo" /></div>
                    <div className="flex-1"><ImageUpload value={commerceForm.banner_url} onChange={(url) => setCommerceForm((p) => ({ ...p, banner_url: url }))} label="Banner" shape="wide" /></div>
                  </div>
                  <button type="submit" disabled={savingCommerce} className="w-full bg-[#25c462] text-white py-2.5 rounded-xl font-medium hover:bg-[#1aaa52] disabled:opacity-50">{savingCommerce ? "Guardando..." : "Crear comercio"}</button>
                </form>
              </div>
            )}
            {commerceMsg && <p className={`text-sm ${commerceMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{commerceMsg}</p>}

            <div className="space-y-3">
              {commerces.length === 0 && <p className="text-center text-gray-400 text-sm py-6">No hay comercios. Crea el primero.</p>}
              {commerces.map((c) => (
                <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                      {c.logo_url ? <img src={c.logo_url} alt={c.name} className="w-full h-full object-cover" /> : "🏪"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.product_count} productos · {c.city}</p>
                    </div>
                    <button onClick={() => handleToggleCommerce(c)} className={`text-[10px] font-bold px-2 py-1 rounded-full ${c.is_open ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.is_open ? "ABIERTO" : "CERRADO"}</button>
                  </div>
                  <div className="flex border-t border-gray-100">
                    <button onClick={() => openCommerce(c)} className="flex-1 py-2.5 text-sm font-medium text-[#25c462] hover:bg-green-50">Gestionar productos</button>
                    <button onClick={() => setEditCommerce({ ...c })} className="px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 border-l border-gray-100">Editar</button>
                    <button onClick={() => handleDeleteCommerce(c)} className="px-4 py-2.5 text-sm text-red-400 hover:bg-red-50 border-l border-gray-100">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GESTIÓN DE UN COMERCIO */}
        {tab === "commerces" && selectedCommerce && (
          <div className="space-y-4">
            <button onClick={() => setSelectedCommerce(null)} className="text-sm text-gray-500 flex items-center gap-1">← Volver a comercios</button>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl overflow-hidden">
                {selectedCommerce.logo_url ? <img src={selectedCommerce.logo_url} alt="" className="w-full h-full object-cover" /> : "🏪"}
              </div>
              <div className="flex-1">
                <p className="font-bold">{selectedCommerce.name}</p>
                <p className="text-xs text-gray-400">{products.length} productos · {categories.length} categorías</p>
              </div>
              <button onClick={() => setEditCommerce({ ...selectedCommerce })} className="text-sm text-[#25c462] font-medium">Editar</button>
            </div>

            {menuMsg && <p className={`text-sm ${menuMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{menuMsg}</p>}

            {/* Categoría */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-bold mb-2 text-sm">Nueva categoría</h3>
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input value={catForm.name} onChange={(e) => setCatForm({ name: e.target.value })} className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Ej: Jugos naturales" required />
                <button type="submit" disabled={creatingMenu} className="bg-[#25c462] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#1aaa52] disabled:opacity-50">Crear</button>
              </form>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {categories.map((c) => <span key={c.id} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{c.name} ({c.product_count})</span>)}
                </div>
              )}
            </div>

            {/* Producto nuevo */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-bold mb-2 text-sm">Nuevo producto</h3>
              {categories.length === 0 ? (
                <p className="text-xs text-gray-400">Crea una categoría primero.</p>
              ) : (
                <form onSubmit={handleCreateProduct} className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-24"><ImageUpload value={prodForm.image_url} onChange={(url) => setProdForm((p) => ({ ...p, image_url: url }))} label="Foto" /></div>
                    <div className="flex-1 space-y-2">
                      <select value={prodForm.category_id} onChange={(e) => setProdForm((p) => ({ ...p, category_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" required>
                        <option value="">Categoría...</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input value={prodForm.name} onChange={(e) => setProdForm((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Nombre" required />
                      <input type="number" step="any" value={prodForm.price} onChange={(e) => setProdForm((p) => ({ ...p, price: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Precio (ej: 8900)" required />
                    </div>
                  </div>
                  <input value={prodForm.description} onChange={(e) => setProdForm((p) => ({ ...p, description: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Descripción" />
                  <button type="submit" disabled={creatingMenu} className="w-full bg-[#25c462] text-white py-2.5 rounded-xl font-medium hover:bg-[#1aaa52] disabled:opacity-50">{creatingMenu ? "Creando..." : "Agregar producto"}</button>
                </form>
              )}
            </div>

            {/* Lista de productos */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-600">{products.length} productos</p>
              {products.map((p) => (
                <div key={p.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : "🍽"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${!p.is_available ? "line-through text-gray-400" : ""}`}>{p.name}</p>
                    <p className="text-xs text-gray-400">${p.price.toLocaleString("es-CO")}</p>
                  </div>
                  <button onClick={() => setEditProduct({ ...p })} className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">Editar</button>
                  <button onClick={() => handleToggleProduct(p)} className={`text-xs px-3 py-1 rounded-full font-medium ${p.is_available ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{p.is_available ? "Activo" : "Inactivo"}</button>
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
                  {d.dealerStats && <span className={`text-xs font-bold ${rankColor[d.dealerStats.rank] || "text-gray-500"}`}>{d.dealerStats.rank}</span>}
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
              <div key={o.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-[#25c462]/40 transition-colors" onClick={() => router.push(`/orders/${o.id}`)}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-400 font-mono">{o.id.slice(0, 8)}…</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[o.status] || "bg-gray-100 text-gray-500"}`}>{statusLabel[o.status] || o.status}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{o.delivery_address}</p>
                <p className="text-sm font-bold text-[#25c462] mt-1">${Number(o.total).toLocaleString("es-CO")}</p>
              </div>
            ))}
          </div>
        )}

        {/* AJUSTES - Cloudinary */}
        {tab === "settings" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm">Cloudinary</h3>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${cloudStatus.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {cloudStatus.enabled ? "ACTIVO" : "INACTIVO"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-4">Si lo configuras, las imágenes se suben a Cloudinary. Si no, se guardan localmente en el servidor.</p>
              <form onSubmit={handleSaveCloud} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cloud name</label>
                  <input value={cloudForm.cloud_name} onChange={(e) => setCloudForm((p) => ({ ...p, cloud_name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="ej: dxxxxxx" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">API Key</label>
                  <input value={cloudForm.api_key} onChange={(e) => setCloudForm((p) => ({ ...p, api_key: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="123456789012345" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">API Secret {cloudStatus.has_secret && <span className="text-green-600">(ya configurado)</span>}</label>
                  <input type="password" value={cloudForm.api_secret} onChange={(e) => setCloudForm((p) => ({ ...p, api_secret: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder={cloudStatus.has_secret ? "•••••• (dejar vacío para no cambiar)" : "Tu API secret"} />
                </div>
                <button type="submit" disabled={savingCloud} className="w-full bg-[#25c462] text-white py-2.5 rounded-xl font-medium hover:bg-[#1aaa52] disabled:opacity-50">{savingCloud ? "Guardando..." : "Guardar configuración"}</button>
              </form>
              {cloudMsg && <p className={`text-sm mt-2 ${cloudMsg.startsWith("✅") ? "text-green-600" : "text-amber-600"}`}>{cloudMsg}</p>}
            </div>
            <p className="text-xs text-gray-400 px-1">Encuentra estas credenciales en tu Dashboard de Cloudinary → Product Environment Credentials.</p>
          </div>
        )}
      </main>

      {/* MODAL editar comercio */}
      {editCommerce && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setEditCommerce(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Editar comercio</h3>
              <button onClick={() => setEditCommerce(null)} className="text-gray-400 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleUpdateCommerce} className="space-y-3">
              <input value={editCommerce.name} onChange={(e) => setEditCommerce({ ...editCommerce, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Nombre" required />
              <input value={editCommerce.description || ""} onChange={(e) => setEditCommerce({ ...editCommerce, description: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Descripción" />
              <div className="flex gap-2">
                <input value={editCommerce.city || ""} onChange={(e) => setEditCommerce({ ...editCommerce, city: e.target.value })} className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Ciudad" />
                <input type="number" value={editCommerce.delivery_fee} onChange={(e) => setEditCommerce({ ...editCommerce, delivery_fee: Number(e.target.value) })} className="w-32 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Domicilio $" />
              </div>
              <input value={editCommerce.avg_delivery_time || ""} onChange={(e) => setEditCommerce({ ...editCommerce, avg_delivery_time: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Tiempo estimado" />
              <div className="flex gap-4">
                <div className="w-24"><ImageUpload value={editCommerce.logo_url} onChange={(url) => setEditCommerce({ ...editCommerce, logo_url: url })} label="Logo" /></div>
                <div className="flex-1"><ImageUpload value={editCommerce.banner_url} onChange={(url) => setEditCommerce({ ...editCommerce, banner_url: url })} label="Banner" shape="wide" /></div>
              </div>
              <button type="submit" disabled={savingCommerce} className="w-full bg-[#25c462] text-white py-2.5 rounded-xl font-medium hover:bg-[#1aaa52] disabled:opacity-50">{savingCommerce ? "Guardando..." : "Guardar cambios"}</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL editar producto */}
      {editProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setEditProduct(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Editar producto</h3>
              <button onClick={() => setEditProduct(null)} className="text-gray-400 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleUpdateProduct} className="space-y-3">
              <div className="flex gap-3">
                <div className="w-24"><ImageUpload value={editProduct.image_url} onChange={(url) => setEditProduct({ ...editProduct, image_url: url })} label="Foto" /></div>
                <div className="flex-1 space-y-2">
                  <select value={editProduct.category_id} onChange={(e) => setEditProduct({ ...editProduct, category_id: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" required>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Nombre" required />
                  <input type="number" step="any" value={editProduct.price} onChange={(e) => setEditProduct({ ...editProduct, price: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462]" placeholder="Precio" required />
                </div>
              </div>
              <textarea value={editProduct.description || ""} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25c462] resize-none" rows={2} placeholder="Descripción" />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={!!editProduct.is_available} onChange={(e) => setEditProduct({ ...editProduct, is_available: e.target.checked ? 1 : 0 })} className="rounded" />
                Disponible
              </label>
              <button type="submit" disabled={creatingMenu} className="w-full bg-[#25c462] text-white py-2.5 rounded-xl font-medium hover:bg-[#1aaa52] disabled:opacity-50">{creatingMenu ? "Guardando..." : "Guardar cambios"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
