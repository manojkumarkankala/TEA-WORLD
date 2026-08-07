import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, Tag, ArrowRight, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { supabase, type Coupon } from '@/lib/supabase';
import { inr, inr2 } from '@/lib/format';

export function CartPage() {
  const { items, setQty, remove, clear, coupon, discount, applyCoupon, subtotal, gstTotal } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  const [applying, setApplying] = useState(false);

  const grandTotal = Math.max(0, subtotal + gstTotal - discount);

  const handleApply = async () => {
    if (!couponInput.trim()) return;
    setApplying(true);
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponInput.trim().toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    const c = data as Coupon | null;
    if (!c) {
      toast('Invalid coupon code', 'error');
      applyCoupon(null, 0);
      setApplying(false);
      return;
    }
    if (c.expiry_date && new Date(c.expiry_date) < new Date()) {
      toast('Coupon has expired', 'error');
      applyCoupon(null, 0);
      setApplying(false);
      return;
    }
    if (subtotal < c.min_amount) {
      toast(`Minimum order ${inr(c.min_amount)} required`, 'error');
      applyCoupon(null, 0);
      setApplying(false);
      return;
    }
    let disc = 0;
    if (c.discount_type === 'percent') {
      disc = (subtotal * c.discount_value) / 100;
      if (c.max_discount > 0) disc = Math.min(disc, c.max_discount);
    } else {
      disc = c.discount_value;
    }
    applyCoupon(c.code, disc);
    toast(`${c.code} applied — you saved ${inr(disc)}!`);
    setApplying(false);
  };

  const handleRemoveCoupon = () => {
    applyCoupon(null, 0);
    setCouponInput('');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <ShoppingBag className="h-20 w-20 text-tea-200 mb-6" />
        <h2 className="font-display text-3xl font-bold text-tea-900">Your cart is empty</h2>
        <p className="text-clay-600 mt-2">Add some delicious drinks to get started!</p>
        <Link
          to="/menu"
          className="mt-6 flex items-center gap-2 rounded-xl bg-tea-600 px-6 py-3 font-semibold text-cream-50 hover:bg-tea-700 transition-colors"
        >
          Browse Menu <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h1 className="font-display text-4xl font-bold text-tea-900 mb-8">Your Cart</h1>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 200 }}
                  className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm border border-cream-200"
                >
                  <img
                    src={item.product.image_url ?? ''}
                    alt={item.product.name}
                    className="h-24 w-24 rounded-xl object-cover bg-cream-100"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display text-lg font-bold text-clay-900">{item.product.name}</h3>
                        <p className="text-sm text-clay-500">{inr(item.product.price)} · GST {item.product.gst_percent}%</p>
                      </div>
                      <button
                        onClick={() => remove(item.product.id)}
                        className="text-clay-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQty(item.product.id, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream-100 hover:bg-tea-50 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => setQty(item.product.id, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream-100 hover:bg-tea-50 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-tea-700">
                          {inr2(item.product.price * item.quantity + (item.product.price * item.quantity * item.product.gst_percent) / 100)}
                        </div>
                        <div className="text-xs text-clay-400">incl. GST</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <button
              onClick={clear}
              className="text-sm text-clay-500 hover:text-red-500 transition-colors"
            >
              Clear cart
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-sm border border-cream-200">
              <h2 className="font-display text-xl font-bold text-clay-900 mb-4">Order Summary</h2>

              {/* Coupon */}
              <div className="mb-4">
                {coupon ? (
                  <div className="flex items-center justify-between rounded-xl bg-tea-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-tea-600" />
                      <span className="font-medium text-tea-700">{coupon}</span>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-tea-600 hover:text-tea-800">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Coupon code"
                      className="flex-1 rounded-xl border border-cream-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tea-400"
                    />
                    <button
                      onClick={handleApply}
                      disabled={applying}
                      className="rounded-xl bg-tea-600 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-tea-700 disabled:opacity-50 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
                <p className="mt-2 text-xs text-clay-400">Try TEA10, WELCOME20, or FREETEA</p>
              </div>

              <div className="space-y-2 text-sm border-t border-cream-200 pt-4">
                <div className="flex justify-between"><span className="text-clay-600">Subtotal</span><span className="font-medium">{inr2(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-clay-600">GST</span><span className="font-medium">{inr2(gstTotal)}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-tea-600"><span>Discount</span><span>-{inr2(discount)}</span></div>
                )}
                <div className="flex justify-between border-t border-cream-200 pt-2 mt-2">
                  <span className="font-bold text-clay-900">Grand Total</span>
                  <span className="font-display text-2xl font-bold text-tea-700">{inr2(grandTotal)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-tea-600 px-6 py-3.5 font-semibold text-cream-50 hover:bg-tea-700 transition-colors shadow"
              >
                Checkout <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
