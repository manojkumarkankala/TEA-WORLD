import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Banknote, Smartphone, CreditCard, Check, ArrowLeft, User, Phone, Hash, MessageSquare } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { inr, inr2 } from '@/lib/format';

export function CheckoutPage() {
  const { items, subtotal, gstTotal, discount, coupon, clear } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    mobile_number: '',
    table_number: '',
    special_instructions: '',
    payment_method: 'Cash',
  });

  const grandTotal = Math.max(0, subtotal + gstTotal - discount);

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <p className="text-clay-600 text-lg">Your cart is empty.</p>
        <Link to="/menu" className="mt-4 text-tea-600 font-medium hover:underline">Go to Menu</Link>
      </div>
    );
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const placeOrder = async () => {
    if (!form.customer_name.trim() || !form.mobile_number.trim()) {
      toast('Please enter your name and mobile number', 'error');
      return;
    }
    if (form.mobile_number.replace(/\D/g, '').length < 10) {
      toast('Please enter a valid mobile number', 'error');
      return;
    }
    setPlacing(true);

    const estimatedMinutes = Math.max(...items.map((i) => i.product.prep_time_minutes), 5);

    const { data: orderNumber } = await supabase.rpc('generate_order_number');

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber ?? 'TW-0001',
        user_id: user?.id ?? null,
        customer_name: form.customer_name,
        mobile_number: form.mobile_number,
        table_number: form.table_number || null,
        special_instructions: form.special_instructions || null,
        payment_method: form.payment_method,
        status: 'pending',
        subtotal,
        gst_total: gstTotal,
        discount,
        grand_total: grandTotal,
        coupon_code: coupon,
        estimated_minutes: estimatedMinutes,
      })
      .select()
      .single();

    if (error || !order) {
      toast('Could not place order. Please try again.', 'error');
      setPlacing(false);
      return;
    }

    const orderItems = items.map((i) => ({
      order_id: order.id,
      product_id: i.product.id,
      product_name: i.product.name,
      quantity: i.quantity,
      price: i.product.price,
      gst_percent: i.product.gst_percent,
      image_url: i.product.image_url,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
      toast('Order placed but items failed to save', 'error');
    }

    if (coupon) {
      await supabase.rpc('increment_coupon_usage', { code: coupon });
    }

    clear();
    toast('Order placed successfully!');
    navigate(`/track?id=${order.id}`);
  };

  const paymentMethods = [
    { id: 'Cash', label: 'Cash', icon: Banknote },
    { id: 'UPI', label: 'UPI', icon: Smartphone },
    { id: 'Card', label: 'Card', icon: CreditCard },
  ];

  return (
    <div className="bg-cream-50 min-h-screen py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link to="/cart" className="flex items-center gap-1 text-clay-600 hover:text-tea-600 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to cart
        </Link>
        <h1 className="font-display text-4xl font-bold text-tea-900 mb-8">Checkout</h1>

        {!user && (
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <Link to="/login" className="font-semibold underline">Login</Link> to get discounts, faster checkout, and reward points.
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-cream-200">
              <h2 className="font-display text-xl font-bold text-clay-900 mb-4">Customer Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field icon={<User className="h-4 w-4" />} label="Customer Name *">
                  <input
                    value={form.customer_name}
                    onChange={(e) => set('customer_name', e.target.value)}
                    className="input"
                    placeholder="Your name"
                  />
                </Field>
                <Field icon={<Phone className="h-4 w-4" />} label="Mobile Number *">
                  <input
                    value={form.mobile_number}
                    onChange={(e) => set('mobile_number', e.target.value)}
                    className="input"
                    placeholder="10-digit mobile"
                    maxLength={10}
                  />
                </Field>
                <Field icon={<Hash className="h-4 w-4" />} label="Table Number">
                  <input
                    value={form.table_number}
                    onChange={(e) => set('table_number', e.target.value)}
                    className="input"
                    placeholder="e.g. 4"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field icon={<MessageSquare className="h-4 w-4" />} label="Special Instructions">
                    <textarea
                      value={form.special_instructions}
                      onChange={(e) => set('special_instructions', e.target.value)}
                      className="input min-h-20"
                      placeholder="Less sugar, extra ginger, etc."
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-cream-200">
              <h2 className="font-display text-xl font-bold text-clay-900 mb-4">Payment Method</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {paymentMethods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => set('payment_method', m.id)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-colors ${
                      form.payment_method === m.id
                        ? 'border-tea-600 bg-tea-50'
                        : 'border-cream-200 hover:border-tea-300'
                    }`}
                  >
                    <m.icon className={`h-5 w-5 ${form.payment_method === m.id ? 'text-tea-600' : 'text-clay-500'}`} />
                    <span className="font-medium text-clay-800">{m.label}</span>
                    {form.payment_method === m.id && <Check className="h-4 w-4 text-tea-600 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-sm border border-cream-200">
              <h2 className="font-display text-xl font-bold text-clay-900 mb-4">Order Summary</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                {items.map((i) => (
                  <div key={i.product.id} className="flex justify-between text-sm">
                    <span className="text-clay-600">{i.product.name} × {i.quantity}</span>
                    <span className="font-medium">{inr(i.product.price * i.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm border-t border-cream-200 pt-4">
                <div className="flex justify-between"><span className="text-clay-600">Subtotal</span><span>{inr2(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-clay-600">GST</span><span>{inr2(gstTotal)}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-tea-600"><span>Discount {coupon ? `(${coupon})` : ''}</span><span>-{inr2(discount)}</span></div>
                )}
                <div className="flex justify-between border-t border-cream-200 pt-2 mt-2">
                  <span className="font-bold">Grand Total</span>
                  <span className="font-display text-2xl font-bold text-tea-700">{inr2(grandTotal)}</span>
                </div>
              </div>
              <button
                onClick={placeOrder}
                disabled={placing}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-tea-600 px-6 py-3.5 font-semibold text-cream-50 hover:bg-tea-700 disabled:opacity-50 transition-colors shadow"
              >
                {placing ? 'Placing Order…' : <>Confirm Order <Check className="h-5 w-5" /></>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--color-cream-200);
          background: white;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px var(--color-tea-400);
        }
      `}</style>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-sm font-medium text-clay-700 mb-1.5">{icon} {label}</span>
      {children}
    </label>
  );
}
