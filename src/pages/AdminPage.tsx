import { useEffect, useState, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Video, Star, Image as ImageIcon,
  Tag, Bell, BarChart3, LogOut, Menu as MenuIcon, X, Plus, Edit, Trash2,
  Check, XCircle, Eye, EyeOff, TrendingUp, DollarSign, Clock, Users, Award,
  Save, Upload, MapPin,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase, type Product, type Order, type Review, type Category, type Coupon, type Offer, type GalleryItem, type VideoItem, type Notification, type ShopDetails } from '@/lib/supabase';
import { inr, inr2, formatDate, formatTime } from '@/lib/format';
import { StarRating } from '@/components/StarRating';
import { MediaUpload } from '@/components/MediaUpload';

type Tab = 'dashboard' | 'products' | 'orders' | 'videos' | 'reviews' | 'gallery' | 'offers' | 'notifications' | 'reports' | 'contact';

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'videos', label: 'Video Manager', icon: Video },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'gallery', label: 'Gallery', icon: ImageIcon },
  { id: 'offers', label: 'Offers & Coupons', icon: Tag },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'contact', label: 'Contact & Location', icon: MapPin },
];

export function AdminPage() {
  const { isAdmin, loading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clay-500">Loading…</div>;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-cream-100 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:sticky top-0 z-50 h-screen w-64 bg-tea-900 text-cream-100 transition-transform flex flex-col`}
      >
        <div className="p-5 border-b border-tea-800">
          <Link to="/" className="font-display text-xl font-bold text-cream-50">Tea World</Link>
          <p className="text-xs text-cream-200/60 mt-1">Admin Dashboard</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-tea-600 text-cream-50' : 'text-cream-200/70 hover:bg-tea-800'
              }`}
            >
              <t.icon className="h-5 w-5" /> {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-tea-800">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-cream-200/70 hover:bg-red-900/40 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />}

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-cream-50 border-b border-cream-200 px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <MenuIcon className="h-6 w-6 text-clay-700" />
          </button>
          <h1 className="font-display text-xl font-bold text-tea-900 capitalize">
            {TABS.find((t) => t.id === tab)?.label}
          </h1>
          <Link to="/" className="text-sm text-tea-600 font-medium hover:underline">View Site</Link>
        </header>

        <div className="p-4 sm:px-6 sm:py-8">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {tab === 'dashboard' && <DashboardTab />}
              {tab === 'products' && <ProductsTab />}
              {tab === 'orders' && <OrdersTab />}
              {tab === 'videos' && <VideosTab />}
              {tab === 'reviews' && <ReviewsTab />}
              {tab === 'gallery' && <GalleryTab />}
              {tab === 'offers' && <OffersTab />}
              {tab === 'notifications' && <NotificationsTab />}
              {tab === 'reports' && <ReportsTab />}
              {tab === 'contact' && <ContactTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ============ Dashboard ============ */
function DashboardTab() {
  const [stats, setStats] = useState({ todayOrders: 0, revenue: 0, pending: 0, completed: 0, cancelled: 0, customers: 0, products: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [{ data: orders }, { count: todayCount }, { count: pending }, { count: completed }, { count: cancelled }, { count: prods }, { data: recent }] = await Promise.all([
        supabase.from('orders').select('grand_total').gte('created_at', today),
        supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'accepted', 'preparing']),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(5),
      ]);
      const rev = (orders ?? []).reduce((s, o: any) => s + Number(o.grand_total), 0);
      setStats({
        todayOrders: todayCount ?? 0,
        revenue: rev,
        pending: pending ?? 0,
        completed: completed ?? 0,
        cancelled: cancelled ?? 0,
        customers: 0,
        products: prods ?? 0,
      });
      setRecentOrders(recent as Order[] ?? []);
    })();
  }, []);

  const cards = [
    { label: "Today's Orders", value: stats.todayOrders, icon: ShoppingBag, color: 'tea' },
    { label: 'Revenue', value: inr(stats.revenue), icon: DollarSign, color: 'amber' },
    { label: 'Pending Orders', value: stats.pending, icon: Clock, color: 'amber' },
    { label: 'Completed', value: stats.completed, icon: Check, color: 'tea' },
    { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'red' },
    { label: 'Products', value: stats.products, icon: Package, color: 'tea' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white p-5 shadow-sm border border-cream-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-clay-500">{c.label}</p>
                <p className="font-display text-3xl font-bold text-clay-900 mt-1">{c.value}</p>
              </div>
              <span className={`flex h-12 w-12 items-center justify-center rounded-full bg-${c.color}-50 text-${c.color}-600`}>
                <c.icon className="h-6 w-6" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Simple chart */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-cream-200">
        <h3 className="font-display text-lg font-bold text-clay-900 mb-4">Weekly Overview</h3>
        <div className="flex items-end gap-2 h-40">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => {
            const h = 30 + ((i * 37) % 70);
            return (
              <div key={d} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.1 }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-tea-600 to-tea-400"
                />
                <span className="text-xs text-clay-500">{d}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-cream-200">
        <h3 className="font-display text-lg font-bold text-clay-900 mb-4">Recent Orders</h3>
        <div className="space-y-3">
          {recentOrders.length === 0 ? (
            <p className="text-clay-500 text-sm">No orders yet.</p>
          ) : (
            recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between border-b border-cream-100 pb-3 last:border-0">
                <div>
                  <div className="font-semibold text-clay-900">{o.customer_name} · {o.order_number}</div>
                  <div className="text-xs text-clay-500">{formatTime(o.created_at)} · {o.table_number ? `Table ${o.table_number}` : 'Takeaway'}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-tea-700">{inr2(o.grand_total)}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === 'delivered' ? 'bg-tea-50 text-tea-700' : o.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ Products ============ */
function ProductsTab() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, categories(name, slug)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    setProducts(prods ?? []);
    setCategories(cats ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast('Could not delete', 'error'); return; }
    toast('Product deleted');
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-clay-600">{products.length} products</p>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl bg-tea-600 px-4 py-2.5 font-semibold text-cream-50 hover:bg-tea-700 transition-colors"
        >
          <Plus className="h-5 w-5" /> Add Product
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="rounded-2xl bg-white p-4 shadow-sm border border-cream-200">
            <div className="flex gap-3">
              <img src={p.image_url ?? ''} alt={p.name} className="h-20 w-20 rounded-xl object-cover bg-cream-100" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-clay-900 truncate">{p.name}</h3>
                <p className="text-xs text-clay-500">{p.categories?.name ?? 'Uncategorized'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-tea-700">{inr(p.price)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_available ? 'bg-tea-50 text-tea-700' : 'bg-red-50 text-red-600'}`}>
                    {p.is_available ? 'Available' : 'Off'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setEditing(p); setShowForm(true); }} className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-cream-100 py-2 text-sm font-medium text-clay-700 hover:bg-tea-50">
                <Edit className="h-4 w-4" /> Edit
              </button>
              <button onClick={() => handleDelete(p.id)} className="flex items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <ProductForm
            product={editing}
            categories={categories}
            onClose={() => setShowForm(false)}
            onSaved={() => { setShowForm(false); load(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductForm({ product, categories, onClose, onSaved }: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price ?? 0,
    gst_percent: product?.gst_percent ?? 5,
    prep_time_minutes: product?.prep_time_minutes ?? 5,
    is_veg: product?.is_veg ?? true,
    stock: product?.stock ?? 50,
    image_url: product?.image_url ?? '',
    video_url: product?.video_url ?? '',
    offer_label: product?.offer_label ?? '',
    is_available: product?.is_available ?? true,
    is_featured: product?.is_featured ?? false,
    is_popular: product?.is_popular ?? false,
    category_id: product?.category_id ?? categories[0]?.id ?? '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      gst_percent: Number(form.gst_percent),
      prep_time_minutes: Number(form.prep_time_minutes),
      stock: Number(form.stock),
      category_id: form.category_id || null,
    };
    const { error } = product
      ? await supabase.from('products').update(payload).eq('id', product.id)
      : await supabase.from('products').insert(payload);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast(product ? 'Product updated' : 'Product added');
    onSaved();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-tea-900">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-clay-400" /></button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name"><input className="ainput" value={form.name} onChange={(e) => set('name', e.target.value)} /></FormField>
          <FormField label="Category">
            <select className="ainput" value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Description" full><textarea className="ainput min-h-16" value={form.description} onChange={(e) => set('description', e.target.value)} /></FormField>
          <FormField label="Price (₹)"><input type="number" className="ainput" value={form.price} onChange={(e) => set('price', e.target.value)} /></FormField>
          <FormField label="GST %"><input type="number" className="ainput" value={form.gst_percent} onChange={(e) => set('gst_percent', e.target.value)} /></FormField>
          <FormField label="Prep Time (min)"><input type="number" className="ainput" value={form.prep_time_minutes} onChange={(e) => set('prep_time_minutes', e.target.value)} /></FormField>
          <FormField label="Stock"><input type="number" className="ainput" value={form.stock} onChange={(e) => set('stock', e.target.value)} /></FormField>
          <FormField label="Image" full>
            <div className="space-y-2">
              <input className="ainput" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="Paste URL or upload…" />
              <MediaUpload folder="products" accept="image/*" value={form.image_url} onChange={(url) => set('image_url', url)} label="Upload Image" />
            </div>
          </FormField>
          <FormField label="Video" full>
            <div className="space-y-2">
              <input className="ainput" value={form.video_url} onChange={(e) => set('video_url', e.target.value)} placeholder="Paste URL or upload…" />
              <MediaUpload folder="product-videos" accept="video/mp4,video/webm" value={form.video_url} onChange={(url) => set('video_url', url)} label="Upload Video" />
            </div>
          </FormField>
          <FormField label="Offer Label"><input className="ainput" value={form.offer_label} onChange={(e) => set('offer_label', e.target.value)} placeholder="e.g. 10% OFF" /></FormField>
          <div className="flex flex-wrap items-end gap-4 sm:col-span-2">
            {[
              ['is_veg', 'Veg'], ['is_available', 'Available'], ['is_featured', 'Featured'], ['is_popular', 'Popular'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm font-medium text-clay-700">
                <input type="checkbox" checked={form[key as keyof typeof form] as boolean} onChange={(e) => set(key, e.target.checked)} className="h-4 w-4 rounded accent-tea-600" />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={onClose} className="rounded-xl bg-cream-100 px-5 py-2.5 font-medium text-clay-700">Cancel</button>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-tea-600 px-5 py-2.5 font-semibold text-cream-50 hover:bg-tea-700 disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        <style>{`.ainput{width:100%;border-radius:0.6rem;border:1px solid var(--color-cream-200);padding:0.5rem 0.75rem;font-size:0.875rem}.ainput:focus{outline:none;box-shadow:0 0 0 2px var(--color-tea-400)}`}</style>
      </motion.div>
    </motion.div>
  );
}

/* ============ Orders ============ */
function OrdersTab() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const load = useCallback(async () => {
    let q = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(50);
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setOrders(data as Order[] ?? []);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // Realtime
  useEffect(() => {
    const channel = supabase.channel('admin-orders').on('postgres_changes', {
      event: '*', schema: 'public', table: 'orders',
    }, () => load()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) { toast('Could not update order', 'error'); return; }
    toast(`Order ${status}`);
    load();
  };

  const filters = ['all', 'pending', 'accepted', 'preparing', 'ready', 'out_for_table', 'delivered', 'cancelled'];

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-tea-600 text-cream-50' : 'bg-white text-clay-600 border border-cream-200 hover:bg-tea-50'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center text-clay-500 border border-cream-200">No orders found.</div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="rounded-2xl bg-white p-5 shadow-sm border border-cream-200">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-clay-900">{o.customer_name}</h3>
                    {o.table_number && <span className="rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-medium text-clay-600">Table {o.table_number}</span>}
                  </div>
                  <div className="text-xs text-clay-500 mt-0.5">{o.order_number} · {formatTime(o.created_at)} · {o.payment_method}</div>
                  {o.special_instructions && <div className="text-xs text-amber-700 mt-1">Note: {o.special_instructions}</div>}
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${o.status === 'delivered' ? 'bg-tea-50 text-tea-700' : o.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                  {o.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {o.order_items?.map((item) => (
                  <span key={item.id} className="rounded-lg bg-cream-100 px-3 py-1.5 text-sm text-clay-700">
                    {item.product_name} × {item.quantity}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between flex-wrap gap-3 border-t border-cream-100 pt-3">
                <div className="text-sm">
                  <span className="text-clay-600">Subtotal {inr2(o.subtotal)} · GST {inr2(o.gst_total)}</span>
                  {o.discount > 0 && <span className="text-tea-600"> · Disc -{inr2(o.discount)}</span>}
                  <span className="font-bold text-tea-700 ml-2">Total {inr2(o.grand_total)}</span>
                </div>
                <div className="flex gap-2">
                  {o.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(o.id, 'accepted')} className="flex items-center gap-1 rounded-lg bg-tea-600 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-tea-700">
                        <Check className="h-4 w-4" /> Accept
                      </button>
                      <button onClick={() => updateStatus(o.id, 'cancelled')} className="flex items-center gap-1 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </>
                  )}
                  {o.status === 'accepted' && (
                    <button onClick={() => updateStatus(o.id, 'preparing')} className="flex items-center gap-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
                      Start Preparing
                    </button>
                  )}
                  {o.status === 'preparing' && (
                    <button onClick={() => updateStatus(o.id, 'ready')} className="flex items-center gap-1 rounded-lg bg-tea-600 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-tea-700">
                      <Check className="h-4 w-4" /> Mark Ready
                    </button>
                  )}
                  {o.status === 'ready' && (
                    <button onClick={() => updateStatus(o.id, 'out_for_table')} className="flex items-center gap-1 rounded-lg bg-tea-600 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-tea-700">
                      <Check className="h-4 w-4" /> Out for Table
                    </button>
                  )}
                  {o.status === 'out_for_table' && (
                    <button onClick={() => updateStatus(o.id, 'delivered')} className="flex items-center gap-1 rounded-lg bg-tea-600 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-tea-700">
                      <Check className="h-4 w-4" /> Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ============ Videos ============ */
function VideosTab() {
  const { toast } = useToast();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category_slug: '', video_url: '', poster_url: '' });

  const load = useCallback(async () => {
    const { data } = await supabase.from('videos').select('*').order('sort_order');
    setVideos(data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.title || !form.video_url) { toast('Title and URL required', 'error'); return; }
    const { error } = await supabase.from('videos').insert({ ...form, sort_order: videos.length + 1 });
    if (error) { toast(error.message, 'error'); return; }
    toast('Video added');
    setForm({ title: '', category_slug: '', video_url: '', poster_url: '' });
    setShowForm(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    await supabase.from('videos').delete().eq('id', id);
    toast('Video deleted');
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-clay-600">{videos.length} videos</p>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-tea-600 px-4 py-2.5 font-semibold text-cream-50 hover:bg-tea-700">
          <Plus className="h-5 w-5" /> Upload Video
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <div key={v.id} className="rounded-2xl bg-white p-4 shadow-sm border border-cream-200">
            <div className="aspect-video rounded-xl overflow-hidden bg-black mb-3">
              <video src={v.video_url} poster={v.poster_url ?? undefined} controls className="h-full w-full object-cover" />
            </div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-clay-900">{v.title}</h3>
                <p className="text-xs text-clay-500">{v.category_slug ?? 'General'}</p>
              </div>
              <button onClick={() => del(v.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="font-display text-xl font-bold text-tea-900 mb-4">Add Preparation Video</h2>
              <div className="space-y-3">
                <input className="ainput" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <select className="ainput" value={form.category_slug} onChange={(e) => setForm({ ...form, category_slug: e.target.value })}>
                  <option value="">General</option>
                  <option value="tea">Tea</option>
                  <option value="coffee">Coffee</option>
                  <option value="green-tea">Green Tea</option>
                  <option value="milkshake">Milkshake</option>
                  <option value="special-tea">Special Tea</option>
                </select>
                <input className="ainput" placeholder="Video URL or upload below" value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} />
                <MediaUpload folder="prep-videos" accept="video/mp4,video/webm" value={form.video_url} onChange={(url) => setForm({ ...form, video_url: url })} label="Upload Video" />
                <input className="ainput" placeholder="Poster image URL (optional)" value={form.poster_url} onChange={(e) => setForm({ ...form, poster_url: e.target.value })} />
                <MediaUpload folder="video-posters" accept="image/*" value={form.poster_url} onChange={(url) => setForm({ ...form, poster_url: url })} label="Upload Poster" />
              </div>
              <div className="mt-4 flex gap-3 justify-end">
                <button onClick={() => setShowForm(false)} className="rounded-xl bg-cream-100 px-5 py-2.5 font-medium text-clay-700">Cancel</button>
                <button onClick={add} className="rounded-xl bg-tea-600 px-5 py-2.5 font-semibold text-cream-50 hover:bg-tea-700">Add</button>
              </div>
              <style>{`.ainput{width:100%;border-radius:0.6rem;border:1px solid var(--color-cream-200);padding:0.5rem 0.75rem;font-size:0.875rem}.ainput:focus{outline:none;box-shadow:0 0 0 2px var(--color-tea-400)}`}</style>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============ Reviews ============ */
function ReviewsTab() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    setReviews(data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = async (id: string, fields: Partial<Review>) => {
    const { error } = await supabase.from('reviews').update(fields).eq('id', id);
    if (error) { toast('Update failed', 'error'); return; }
    toast('Review updated');
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    toast('Review deleted');
    load();
  };

  return (
    <div className="space-y-4">
      {reviews.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center text-clay-500 border border-cream-200">No reviews yet.</div>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-5 shadow-sm border border-cream-200">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-clay-900">{r.customer_name}</h3>
                  <StarRating rating={r.rating} size={14} />
                </div>
                <p className="text-sm text-clay-600 mt-1">{r.description ?? 'No comment'}</p>
                <p className="text-xs text-clay-400 mt-1">{formatDate(r.created_at)}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.status === 'approved' ? 'bg-tea-50 text-tea-700' : r.status === 'rejected' ? 'bg-red-50 text-red-600' : r.status === 'hidden' ? 'bg-clay-100 text-clay-600' : 'bg-amber-50 text-amber-700'}`}>
                {r.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-cream-100 pt-3">
              {r.status !== 'approved' && <button onClick={() => update(r.id, { status: 'approved' })} className="flex items-center gap-1 rounded-lg bg-tea-50 px-3 py-1.5 text-sm font-medium text-tea-700 hover:bg-tea-100"><Check className="h-4 w-4" /> Approve</button>}
              {r.status !== 'rejected' && <button onClick={() => update(r.id, { status: 'rejected' })} className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"><XCircle className="h-4 w-4" /> Reject</button>}
              {r.status !== 'hidden' && <button onClick={() => update(r.id, { status: 'hidden' })} className="flex items-center gap-1 rounded-lg bg-cream-100 px-3 py-1.5 text-sm font-medium text-clay-600 hover:bg-cream-200"><EyeOff className="h-4 w-4" /> Hide</button>}
              <button onClick={() => update(r.id, { is_featured: !r.is_featured })} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium ${r.is_featured ? 'bg-amber-100 text-amber-700' : 'bg-cream-100 text-clay-600'}`}><Award className="h-4 w-4" /> {r.is_featured ? 'Featured' : 'Feature'}</button>
              <button onClick={() => del(r.id)} className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 ml-auto"><Trash2 className="h-4 w-4" /> Delete</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ============ Gallery ============ */
function GalleryTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', media_url: '', media_type: 'image', section: 'shop' });

  const load = useCallback(async () => {
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    setItems(data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.media_url) { toast('Media URL required', 'error'); return; }
    const { error } = await supabase.from('gallery').insert(form);
    if (error) { toast(error.message, 'error'); return; }
    toast('Added to gallery');
    setForm({ title: '', media_url: '', media_type: 'image', section: 'shop' });
    setShowForm(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await supabase.from('gallery').delete().eq('id', id);
    toast('Deleted');
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-clay-600">{items.length} items</p>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-tea-600 px-4 py-2.5 font-semibold text-cream-50 hover:bg-tea-700">
          <Plus className="h-5 w-5" /> Add Media
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((g) => (
          <div key={g.id} className="group relative rounded-xl overflow-hidden bg-white shadow-sm border border-cream-200">
            {g.media_type === 'image' ? (
              <img src={g.media_url} alt={g.title ?? ''} className="h-40 w-full object-cover" />
            ) : (
              <video src={g.media_url} className="h-40 w-full object-cover" controls />
            )}
            <div className="p-2 flex items-center justify-between">
              <span className="text-xs text-clay-600">{g.title ?? g.section}</span>
              <button onClick={() => del(g.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="font-display text-xl font-bold text-tea-900 mb-4">Add Gallery Media</h2>
              <div className="space-y-3">
                <input className="ainput" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <select className="ainput" value={form.media_type} onChange={(e) => setForm({ ...form, media_type: e.target.value })}>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
                <select className="ainput" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
                  <option value="shop">Shop</option>
                  <option value="staff">Staff</option>
                  <option value="events">Events</option>
                </select>
                <input className="ainput" placeholder="Media URL or upload below" value={form.media_url} onChange={(e) => setForm({ ...form, media_url: e.target.value })} />
                <MediaUpload folder="gallery" accept={form.media_type === 'video' ? 'video/mp4,video/webm' : 'image/*'} value={form.media_url} onChange={(url) => setForm({ ...form, media_url: url })} label="Upload File" />
              </div>
              <div className="mt-4 flex gap-3 justify-end">
                <button onClick={() => setShowForm(false)} className="rounded-xl bg-cream-100 px-5 py-2.5 font-medium text-clay-700">Cancel</button>
                <button onClick={add} className="rounded-xl bg-tea-600 px-5 py-2.5 font-semibold text-cream-50 hover:bg-tea-700">Add</button>
              </div>
              <style>{`.ainput{width:100%;border-radius:0.6rem;border:1px solid var(--color-cream-200);padding:0.5rem 0.75rem;font-size:0.875rem}.ainput:focus{outline:none;box-shadow:0 0 0 2px var(--color-tea-400)}`}</style>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============ Offers & Coupons ============ */
function OffersTab() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showCoupon, setShowCoupon] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percent', discount_value: 10, min_amount: 0, max_discount: 50, expiry_date: '2026-12-31', is_active: true });
  const [offerForm, setOfferForm] = useState({ title: '', description: '', offer_type: 'general', is_active: true, start_time: '', end_time: '' });

  const load = useCallback(async () => {
    const [{ data: c }, { data: o }] = await Promise.all([
      supabase.from('coupons').select('*').order('created_at', { ascending: false }),
      supabase.from('offers').select('*').order('created_at', { ascending: false }),
    ]);
    setCoupons(c ?? []);
    setOffers(o ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addCoupon = async () => {
    if (!couponForm.code) { toast('Code required', 'error'); return; }
    const { error } = await supabase.from('coupons').insert({
      ...couponForm,
      code: couponForm.code.toUpperCase(),
      discount_value: Number(couponForm.discount_value),
      min_amount: Number(couponForm.min_amount),
      max_discount: Number(couponForm.max_discount),
    });
    if (error) { toast(error.message, 'error'); return; }
    toast('Coupon created');
    setShowCoupon(false);
    setCouponForm({ code: '', discount_type: 'percent', discount_value: 10, min_amount: 0, max_discount: 50, expiry_date: '2026-12-31', is_active: true });
    load();
  };

  const addOffer = async () => {
    if (!offerForm.title) { toast('Title required', 'error'); return; }
    const { error } = await supabase.from('offers').insert({
      ...offerForm,
      start_time: offerForm.start_time || null,
      end_time: offerForm.end_time || null,
    });
    if (error) { toast(error.message, 'error'); return; }
    toast('Offer created');
    setShowOffer(false);
    setOfferForm({ title: '', description: '', offer_type: 'general', is_active: true, start_time: '', end_time: '' });
    load();
  };

  const toggleCoupon = async (c: Coupon) => {
    await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id);
    load();
  };
  const delCoupon = async (id: string) => {
    if (!confirm('Delete coupon?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    toast('Coupon deleted');
    load();
  };
  const delOffer = async (id: string) => {
    if (!confirm('Delete offer?')) return;
    await supabase.from('offers').delete().eq('id', id);
    toast('Offer deleted');
    load();
  };

  return (
    <div className="space-y-8">
      {/* Coupons */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-xl font-bold text-tea-900">Coupons</h2>
          <button onClick={() => setShowCoupon(true)} className="flex items-center gap-2 rounded-xl bg-tea-600 px-4 py-2 font-semibold text-cream-50 hover:bg-tea-700">
            <Plus className="h-5 w-5" /> Add Coupon
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white p-5 shadow-sm border border-cream-200">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold text-tea-700">{c.code}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? 'bg-tea-50 text-tea-700' : 'bg-red-50 text-red-600'}`}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-clay-600 mt-1">
                {c.discount_type === 'percent' ? `${c.discount_value}% off` : `${inr(c.discount_value)} off`}
                {c.min_amount > 0 && ` · min ${inr(c.min_amount)}`}
              </p>
              <p className="text-xs text-clay-400 mt-1">Used {c.usage_count} times · Expires {c.expiry_date}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => toggleCoupon(c)} className="flex items-center gap-1 rounded-lg bg-cream-100 px-3 py-1.5 text-sm text-clay-700">
                  {c.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {c.is_active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => delCoupon(c.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Offers */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-xl font-bold text-tea-900">Offers</h2>
          <button onClick={() => setShowOffer(true)} className="flex items-center gap-2 rounded-xl bg-tea-600 px-4 py-2 font-semibold text-cream-50 hover:bg-tea-700">
            <Plus className="h-5 w-5" /> Add Offer
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <div key={o.id} className="rounded-2xl bg-gradient-to-br from-tea-600 to-tea-800 p-5 text-cream-50 shadow">
              <span className="text-xs uppercase tracking-wider text-amber-300">{o.offer_type.replace('_', ' ')}</span>
              <h3 className="font-display text-lg font-bold mt-1">{o.title}</h3>
              <p className="text-sm text-cream-100/80 mt-1">{o.description}</p>
              {o.start_time && <p className="text-xs text-amber-300 mt-2">{o.start_time} – {o.end_time}</p>}
              <div className="flex gap-2 mt-3">
                <button onClick={() => supabase.from('offers').update({ is_active: !o.is_active }).eq('id', o.id).then(() => load())} className="rounded-lg bg-cream-50/20 px-3 py-1.5 text-sm">
                  {o.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => delOffer(o.id)} className="rounded-lg bg-red-900/40 px-3 py-1.5 text-sm"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showCoupon && (
          <Modal title="Add Coupon" onClose={() => setShowCoupon(false)} onSave={addCoupon}>
            <input className="ainput" placeholder="Code (e.g. TEA10)" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} />
            <select className="ainput" value={couponForm.discount_type} onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}>
              <option value="percent">Percentage</option><option value="flat">Flat Amount</option>
            </select>
            <input type="number" className="ainput" placeholder="Discount value" value={couponForm.discount_value} onChange={(e) => setCouponForm({ ...couponForm, discount_value: Number(e.target.value) })} />
            <input type="number" className="ainput" placeholder="Min amount" value={couponForm.min_amount} onChange={(e) => setCouponForm({ ...couponForm, min_amount: Number(e.target.value) })} />
            <input type="number" className="ainput" placeholder="Max discount" value={couponForm.max_discount} onChange={(e) => setCouponForm({ ...couponForm, max_discount: Number(e.target.value) })} />
            <input type="date" className="ainput" value={couponForm.expiry_date} onChange={(e) => setCouponForm({ ...couponForm, expiry_date: e.target.value })} />
          </Modal>
        )}
        {showOffer && (
          <Modal title="Add Offer" onClose={() => setShowOffer(false)} onSave={addOffer}>
            <input className="ainput" placeholder="Title" value={offerForm.title} onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })} />
            <textarea className="ainput min-h-16" placeholder="Description" value={offerForm.description} onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })} />
            <select className="ainput" value={offerForm.offer_type} onChange={(e) => setOfferForm({ ...offerForm, offer_type: e.target.value })}>
              <option value="general">General</option><option value="happy_hour">Happy Hour</option>
              <option value="festival">Festival</option><option value="weekend">Weekend</option><option value="student">Student</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="time" className="ainput" value={offerForm.start_time} onChange={(e) => setOfferForm({ ...offerForm, start_time: e.target.value })} />
              <input type="time" className="ainput" value={offerForm.end_time} onChange={(e) => setOfferForm({ ...offerForm, end_time: e.target.value })} />
            </div>
          </Modal>
        )}
      </AnimatePresence>
      <style>{`.ainput{width:100%;border-radius:0.6rem;border:1px solid var(--color-cream-200);padding:0.5rem 0.75rem;font-size:0.875rem}.ainput:focus{outline:none;box-shadow:0 0 0 2px var(--color-tea-400)}`}</style>
    </div>
  );
}

/* ============ Notifications ============ */
function NotificationsTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<Notification[]>([]);
  const [form, setForm] = useState({ title: '', message: '' });

  const load = useCallback(async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    setItems(data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const broadcast = async () => {
    if (!form.title || !form.message) { toast('Title and message required', 'error'); return; }
    const { error } = await supabase.from('notifications').insert({ ...form, is_active: true });
    if (error) { toast(error.message, 'error'); return; }
    toast('Notification broadcast');
    setForm({ title: '', message: '' });
    load();
  };

  const toggle = async (n: Notification) => {
    await supabase.from('notifications').update({ is_active: !n.is_active }).eq('id', n.id);
    load();
  };
  const del = async (id: string) => {
    if (!confirm('Delete notification?')) return;
    await supabase.from('notifications').delete().eq('id', id);
    toast('Deleted');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-cream-200">
        <h2 className="font-display text-xl font-bold text-tea-900 mb-4">Broadcast Notification</h2>
        <div className="space-y-3 max-w-lg">
          <input className="ainput" placeholder="Title (e.g. Today's Offer)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="ainput min-h-16" placeholder="Message (e.g. Buy 2 Get 1 Free!)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <button onClick={broadcast} className="flex items-center gap-2 rounded-xl bg-tea-600 px-5 py-2.5 font-semibold text-cream-50 hover:bg-tea-700">
            <Bell className="h-4 w-4" /> Broadcast
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className="rounded-2xl bg-white p-4 shadow-sm border border-cream-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-clay-900">{n.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${n.is_active ? 'bg-tea-50 text-tea-700' : 'bg-clay-100 text-clay-500'}`}>{n.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <p className="text-sm text-clay-600 mt-0.5">{n.message}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggle(n)} className="rounded-lg bg-cream-100 px-3 py-1.5 text-sm">{n.is_active ? 'Hide' : 'Show'}</button>
              <button onClick={() => del(n.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
      <style>{`.ainput{width:100%;border-radius:0.6rem;border:1px solid var(--color-cream-200);padding:0.5rem 0.75rem;font-size:0.875rem}.ainput:focus{outline:none;box-shadow:0 0 0 2px var(--color-tea-400)}`}</style>
    </div>
  );
}

/* ============ Reports ============ */
function ReportsTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<{ name: string; count: number; revenue: number }[]>([]);
  const [dailySales, setDailySales] = useState<{ date: string; total: number }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: allOrders } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
      const all = allOrders as Order[] ?? [];

      // Product sales
      const prodMap: Record<string, { name: string; count: number; revenue: number }> = {};
      all.forEach((o) => {
        o.order_items?.forEach((i) => {
          if (!prodMap[i.product_name]) prodMap[i.product_name] = { name: i.product_name, count: 0, revenue: 0 };
          prodMap[i.product_name].count += i.quantity;
          prodMap[i.product_name].revenue += i.price * i.quantity;
        });
      });
      setProducts(Object.values(prodMap).sort((a, b) => b.count - a.count).slice(0, 10));

      // Daily sales (last 7 days)
      const daily: Record<string, number> = {};
      for (let d = 6; d >= 0; d--) {
        const date = new Date(); date.setDate(date.getDate() - d);
        daily[date.toISOString().slice(0, 10)] = 0;
      }
      all.forEach((o) => {
        const d = o.created_at.slice(0, 10);
        if (d in daily) daily[d] += Number(o.grand_total);
      });
      setDailySales(Object.entries(daily).map(([date, total]) => ({ date, total })));

      setOrders(all);
    })();
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + Number(o.grand_total), 0);
  const totalGst = orders.reduce((s, o) => s + Number(o.gst_total), 0);
  const maxDaily = Math.max(...dailySales.map((d) => d.total), 1);
  const maxProd = Math.max(...products.map((p) => p.count), 1);

  // Top customers
  const custMap: Record<string, { name: string; count: number; spent: number }> = {};
  orders.forEach((o) => {
    if (!custMap[o.customer_name]) custMap[o.customer_name] = { name: o.customer_name, count: 0, spent: 0 };
    custMap[o.customer_name].count++;
    custMap[o.customer_name].spent += Number(o.grand_total);
  });
  const topCustomers = Object.values(custMap).sort((a, b) => b.spent - a.spent).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-cream-200">
          <p className="text-sm text-clay-500">Total Revenue</p>
          <p className="font-display text-3xl font-bold text-tea-700">{inr2(totalRevenue)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-cream-200">
          <p className="text-sm text-clay-500">Total GST Collected</p>
          <p className="font-display text-3xl font-bold text-amber-600">{inr2(totalGst)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-cream-200">
          <p className="text-sm text-clay-500">Total Orders</p>
          <p className="font-display text-3xl font-bold text-clay-900">{orders.length}</p>
        </div>
      </div>

      {/* Daily sales chart */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-cream-200">
        <h3 className="font-display text-lg font-bold text-clay-900 mb-4">Daily Sales (Last 7 Days)</h3>
        <div className="flex items-end gap-3 h-48">
          {dailySales.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-clay-600">{inr(d.total)}</span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.total / maxDaily) * 100}%` }}
                className="w-full rounded-t-lg bg-gradient-to-t from-tea-600 to-tea-400 min-h-1"
              />
              <span className="text-xs text-clay-500">{new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Best selling drinks */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-cream-200">
          <h3 className="font-display text-lg font-bold text-clay-900 mb-4">Best Selling Drinks</h3>
          <div className="space-y-3">
            {products.map((p, i) => (
              <div key={p.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-clay-700">{i + 1}. {p.name}</span>
                  <span className="text-clay-500">{p.count} sold · {inr2(p.revenue)}</span>
                </div>
                <div className="h-2 rounded-full bg-cream-100 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(p.count / maxProd) * 100}%` }} className="h-full bg-tea-500" />
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="text-clay-500 text-sm">No sales data yet.</p>}
          </div>
        </div>

        {/* Top customers */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-cream-200">
          <h3 className="font-display text-lg font-bold text-clay-900 mb-4">Top Customers</h3>
          <div className="space-y-3">
            {topCustomers.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tea-600 text-cream-50 font-bold text-sm">{i + 1}</span>
                <div className="flex-1">
                  <div className="font-medium text-clay-900">{c.name}</div>
                  <div className="text-xs text-clay-500">{c.count} orders</div>
                </div>
                <span className="font-bold text-tea-700">{inr2(c.spent)}</span>
              </div>
            ))}
            {topCustomers.length === 0 && <p className="text-clay-500 text-sm">No customer data yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Contact & Location ============ */
function ContactTab() {
  const { toast } = useToast();
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('shop_details').select('*').maybeSingle();
    const s = data as ShopDetails | null;
    setShop(s);
    if (s) {
      setForm({
        name: s.name ?? '',
        tagline: s.tagline ?? '',
        phone: s.phone ?? '',
        email: s.email ?? '',
        address: s.address ?? '',
        map_embed_url: s.map_embed_url ?? '',
        hero_video_url: s.hero_video_url ?? '',
        prep_video_url: s.prep_video_url ?? '',
        monday_hours: s.monday_hours ?? '',
        tuesday_hours: s.tuesday_hours ?? '',
        wednesday_hours: s.wednesday_hours ?? '',
        thursday_hours: s.thursday_hours ?? '',
        friday_hours: s.friday_hours ?? '',
        saturday_hours: s.saturday_hours ?? '',
        sunday_hours: s.sunday_hours ?? '',
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload = { ...form };
    const { error } = shop
      ? await supabase.from('shop_details').update(payload).eq('id', shop.id)
      : await supabase.from('shop_details').insert(payload);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Contact information saved');
    load();
  };

  if (loading) return <div className="text-clay-500">Loading…</div>;

  const fields: { key: string; label: string; placeholder?: string; full?: boolean }[] = [
    { key: 'name', label: 'Shop Name', placeholder: 'Tea World' },
    { key: 'tagline', label: 'Tagline', placeholder: 'Brewed with love, served with a smile.', full: true },
    { key: 'phone', label: 'Phone Number', placeholder: '+91 98765 43210' },
    { key: 'email', label: 'Email Address', placeholder: 'hello@teaworld.com' },
    { key: 'address', label: 'Address', placeholder: '123 Main Street, City, State - 600001', full: true },
    { key: 'map_embed_url', label: 'Google Map Embed URL', placeholder: 'https://www.google.com/maps/embed?…', full: true },
    { key: 'hero_video_url', label: 'Hero Background Video URL', placeholder: 'https://…/hero.mp4', full: true },
    { key: 'prep_video_url', label: 'Tea Preparation Video URL', placeholder: 'https://…/prep.mp4', full: true },
  ];

  const hoursFields: { key: string; label: string }[] = [
    { key: 'monday_hours', label: 'Monday' },
    { key: 'tuesday_hours', label: 'Tuesday' },
    { key: 'wednesday_hours', label: 'Wednesday' },
    { key: 'thursday_hours', label: 'Thursday' },
    { key: 'friday_hours', label: 'Friday' },
    { key: 'saturday_hours', label: 'Saturday' },
    { key: 'sunday_hours', label: 'Sunday' },
  ];

  return (
    <div className="space-y-6">
      {/* Shop Info */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-cream-200">
        <h2 className="font-display text-xl font-bold text-tea-900 mb-4">Shop Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <FormField key={f.key} label={f.label} full={f.full}>
              <input className="ainput" value={form[f.key] ?? ''} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} />
            </FormField>
          ))}
        </div>
      </div>

      {/* Opening Hours */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-cream-200">
        <h2 className="font-display text-xl font-bold text-tea-900 mb-4">Opening Hours</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hoursFields.map((h) => (
            <FormField key={h.key} label={h.label}>
              <input className="ainput" value={form[h.key] ?? ''} placeholder="e.g. 8 AM – 10 PM" onChange={(e) => set(h.key, e.target.value)} />
            </FormField>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-tea-600 px-6 py-3 font-semibold text-cream-50 hover:bg-tea-700 disabled:opacity-50 transition-colors">
          <Save className="h-5 w-5" /> {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Map preview */}
      {form.map_embed_url && (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-cream-200">
          <h2 className="font-display text-xl font-bold text-tea-900 mb-4">Map Preview</h2>
          <div className="rounded-xl overflow-hidden h-64 border border-cream-200">
            <iframe src={form.map_embed_url} width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="Location Preview" />
          </div>
        </div>
      )}

      <style>{`.ainput{width:100%;border-radius:0.6rem;border:1px solid var(--color-cream-200);padding:0.5rem 0.75rem;font-size:0.875rem}.ainput:focus{outline:none;box-shadow:0 0 0 2px var(--color-tea-400)}`}</style>
    </div>
  );
}

/* ============ Shared ============ */
function FormField({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-sm font-medium text-clay-700 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-tea-900">{title}</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-clay-400" /></button>
        </div>
        <div className="space-y-3">{children}</div>
        <div className="mt-4 flex gap-3 justify-end">
          <button onClick={onClose} className="rounded-xl bg-cream-100 px-5 py-2.5 font-medium text-clay-700">Cancel</button>
          <button onClick={onSave} className="rounded-xl bg-tea-600 px-5 py-2.5 font-semibold text-cream-50 hover:bg-tea-700">Save</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
