import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, ShoppingBag, Tag, Gift, Camera, Save, X, User, Phone, Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase, type Order, type Coupon, type Profile } from '@/lib/supabase';
import { inr2, formatDate, formatTime } from '@/lib/format';

export function AccountPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: ords }, { data: coups }, { data: prof }] = await Promise.all([
        supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('coupons').select('*').eq('is_active', true),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      ]);
      setOrders(ords as Order[] ?? []);
      setCoupons(coups ?? []);
      const p = prof as Profile | null;
      setProfile(p);
      setEditName(p?.full_name ?? '');
      setEditPhone(p?.phone ?? '');
    })();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-clay-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  const totalSpent = orders.reduce((s, o) => s + Number(o.grand_total), 0);
  const rewardPoints = Math.floor(totalSpent / 10);

  const avatarUrl = profile?.avatar_url;
  const displayName = profile?.full_name?.trim() || user.email?.split('@')[0] || 'Customer';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast('Image must be under 5 MB', 'error');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filePath = `${user.id}/avatar.${ext}`;

    // Delete old avatar if it exists
    if (profile?.avatar_url) {
      const oldPath = profile.avatar_url.split('/profile-images/').pop();
      if (oldPath) {
        await supabase.storage.from('profile-images').remove([oldPath]);
      }
    }

    const { error: upErr } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file, { upsert: true });

    if (upErr) {
      toast('Upload failed', 'error');
      setUploading(false);
      return;
    }

    const { data: pub } = supabase.storage.from('profile-images').getPublicUrl(filePath);
    const url = pub.publicUrl;

    // Upsert profile with new avatar
    const { error: dbErr } = await supabase
      .from('profiles')
      .upsert({ id: user.id, avatar_url: url, full_name: editName, phone: editPhone })
      .eq('id', user.id);

    if (dbErr) {
      toast('Could not save profile', 'error');
      setUploading(false);
      return;
    }

    setProfile((prev) => ({
      id: user.id,
      full_name: editName,
      phone: editPhone,
      avatar_url: url,
      created_at: prev?.created_at ?? '',
      updated_at: prev?.updated_at ?? '',
    }));
    toast('Profile picture updated');
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, full_name: editName.trim(), phone: editPhone.trim(), avatar_url: profile?.avatar_url })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast('Could not save changes', 'error');
      return;
    }
    setProfile((prev) => ({
      id: user.id,
      full_name: editName.trim(),
      phone: editPhone.trim(),
      avatar_url: prev?.avatar_url ?? null,
      created_at: prev?.created_at ?? '',
      updated_at: prev?.updated_at ?? '',
    }));
    toast('Profile updated');
    setEditing(false);
  };

  return (
    <div className="bg-cream-50 min-h-screen py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Profile header with image upload */}
        <div className="rounded-2xl bg-gradient-to-br from-tea-600 to-tea-800 p-6 text-cream-50 shadow-lg mb-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-cream-50/20 border-2 border-cream-50/30">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                title="Change profile picture"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold truncate">{displayName}</h1>
                {!editing && (
                  <button
                    onClick={() => { setEditName(profile?.full_name ?? ''); setEditPhone(profile?.phone ?? ''); setEditing(true); }}
                    className="flex items-center gap-1 rounded-lg bg-cream-50/20 px-3 py-1 text-xs font-medium hover:bg-cream-50/30 transition-colors"
                  >
                    <User className="h-3 w-3" /> Edit
                  </button>
                )}
              </div>
              <p className="text-cream-100/80 text-sm flex items-center gap-1 truncate">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </p>
              {profile?.phone && !editing && (
                <p className="text-cream-100/80 text-sm flex items-center gap-1 mt-0.5">
                  <Phone className="h-3.5 w-3.5" /> {profile.phone}
                </p>
              )}
            </div>
          </div>

          {/* Edit form */}
          <AnimatePresence>
            {editing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 grid gap-3 sm:grid-cols-2 rounded-xl bg-cream-50/10 p-4">
                  <label className="block">
                    <span className="text-xs text-cream-100/70 mb-1 block">Full Name</span>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-lg border border-cream-50/20 bg-cream-50/10 px-3 py-2 text-sm text-cream-50 placeholder-cream-100/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-cream-100/70 mb-1 block">Phone</span>
                    <input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Mobile number"
                      className="w-full rounded-lg border border-cream-50/20 bg-cream-50/10 px-3 py-2 text-sm text-cream-50 placeholder-cream-100/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </label>
                  <div className="sm:col-span-2 flex gap-2 justify-end">
                    <button
                      onClick={() => setEditing(false)}
                      className="flex items-center gap-1 rounded-lg bg-cream-50/20 px-4 py-2 text-sm font-medium hover:bg-cream-50/30"
                    >
                      <X className="h-4 w-4" /> Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-cream-50/10 p-3 text-center">
              <ShoppingBag className="h-5 w-5 mx-auto mb-1 text-amber-300" />
              <div className="font-bold text-lg">{orders.length}</div>
              <div className="text-xs text-cream-100/70">Orders</div>
            </div>
            <div className="rounded-xl bg-cream-50/10 p-3 text-center">
              <Gift className="h-5 w-5 mx-auto mb-1 text-amber-300" />
              <div className="font-bold text-lg">{rewardPoints}</div>
              <div className="text-xs text-cream-100/70">Reward Points</div>
            </div>
            <div className="rounded-xl bg-cream-50/10 p-3 text-center">
              <Tag className="h-5 w-5 mx-auto mb-1 text-amber-300" />
              <div className="font-bold text-lg">{coupons.length}</div>
              <div className="text-xs text-cream-100/70">Coupons</div>
            </div>
          </div>
        </div>

        {/* Available coupons */}
        {coupons.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-xl font-bold text-tea-900 mb-4">Available Coupons</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {coupons.map((c) => (
                <div key={c.id} className="rounded-2xl bg-white p-4 shadow-sm border border-cream-200 border-dashed">
                  <div className="font-display text-lg font-bold text-tea-700">{c.code}</div>
                  <p className="text-sm text-clay-600">{c.discount_type === 'percent' ? `${c.discount_value}% off` : `${inr2(c.discount_value)} off`}</p>
                  {c.min_amount > 0 && <p className="text-xs text-clay-400 mt-1">Min order {inr2(c.min_amount)}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order history */}
        <div>
          <h2 className="font-display text-xl font-bold text-tea-900 mb-4">Order History</h2>
          {orders.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center border border-cream-200">
              <ShoppingBag className="h-12 w-12 text-tea-200 mx-auto mb-3" />
              <p className="text-clay-600">No orders yet.</p>
              <Link to="/menu" className="mt-3 inline-block text-tea-600 font-medium hover:underline">Browse Menu</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-white p-4 shadow-sm border border-cream-200"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-semibold text-clay-900">{o.order_number}</span>
                      <span className="text-xs text-clay-400 ml-2">{formatDate(o.created_at)} · {formatTime(o.created_at)}</span>
                    </div>
                    <Link to={`/track?id=${o.id}`} className="text-tea-600 text-sm font-medium hover:underline">Track →</Link>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {o.order_items?.map((i) => (
                      <span key={i.id} className="text-xs rounded-lg bg-cream-100 px-2.5 py-1 text-clay-600">{i.product_name} × {i.quantity}</span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full ${o.status === 'delivered' ? 'bg-tea-50 text-tea-700' : o.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{o.status}</span>
                    <span className="font-bold text-tea-700">{inr2(o.grand_total)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
