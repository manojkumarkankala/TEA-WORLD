import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Clock, ChefHat, Bell, Truck, PackageCheck, XCircle,
  Play, Star, Search, Coffee,
} from 'lucide-react';
import { supabase, type Order, type VideoItem, STATUS_LABELS } from '@/lib/supabase';
import { StarRating } from '@/components/StarRating';
import { inr2, formatTime } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

const STEPS = ['pending', 'accepted', 'preparing', 'ready', 'out_for_table', 'delivered'];

const STEP_ICONS: Record<string, typeof CheckCircle> = {
  pending: Clock,
  accepted: CheckCircle,
  preparing: ChefHat,
  ready: PackageCheck,
  out_for_table: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

export function TrackPage() {
  const [params, setParams] = useSearchParams();
  const orderId = params.get('id');
  const [searchId, setSearchId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load order
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .maybeSingle();
      setOrder(data as Order | null);
      setLoading(false);
    })();
  }, [orderId]);

  // Realtime subscription
  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        setOrder((prev) => prev ? { ...prev, ...payload.new } : null);
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // When status changes to preparing, show video
  useEffect(() => {
    if (order?.status === 'preparing') {
      (async () => {
        const { data: vids } = await supabase.from('videos').select('*').order('sort_order');
        setVideos(vids ?? []);
      })();
    }
    if (order?.status === 'delivered' && !order.rated) {
      setShowReview(true);
    }
  }, [order?.status, order?.rated]);

  const prepVideo = (() => {
    if (!order || videos.length === 0) return null;
    const firstItem = order.order_items?.[0];
    if (!firstItem) return videos[0];
    const { data: prod } = { data: null };
    // Match by category slug via product — we don't have category here, use first matching video
    return videos[0];
  })();

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    // Try by order id or order number
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .or(`id.eq.${searchId.trim()},order_number.eq.${searchId.trim().toUpperCase()}`)
      .maybeSingle();
    if (data) {
      setOrder(data as Order);
      setParams({ id: data.id });
    } else {
      toast('Order not found', 'error');
    }
  };

  const submitReview = async () => {
    if (!order) return;
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert({
      order_id: order.id,
      customer_name: order.customer_name,
      rating: reviewRating,
      description: reviewText.trim() || null,
      status: 'pending',
    });
    if (error) {
      toast('Could not submit review', 'error');
    } else {
      await supabase.from('orders').update({ rated: true }).eq('id', order.id);
      toast('Review submitted — thank you!');
      setShowReview(false);
      setOrder((prev) => prev ? { ...prev, rated: true } : null);
    }
    setSubmittingReview(false);
  };

  if (!orderId) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <Search className="h-16 w-16 text-tea-200 mb-6" />
        <h2 className="font-display text-3xl font-bold text-tea-900">Track Your Order</h2>
        <p className="text-clay-600 mt-2 mb-6">Enter your order ID or tracking number</p>
        <div className="flex gap-2 w-full max-w-md">
          <input
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. TW-0001 or order ID"
            className="flex-1 rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tea-400"
          />
          <button
            onClick={handleSearch}
            className="rounded-xl bg-tea-600 px-6 py-3 font-semibold text-cream-50 hover:bg-tea-700 transition-colors"
          >
            Track
          </button>
        </div>
        <Link to="/menu" className="mt-6 text-tea-600 font-medium hover:underline">Browse Menu</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-clay-500">Loading your order…</div>;
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-clay-600">Order not found.</p>
        <Link to="/menu" className="mt-4 text-tea-600 font-medium hover:underline">Browse Menu</Link>
      </div>
    );
  }

  const currentStepIndex = STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="bg-cream-50 min-h-screen py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Order confirmation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white p-6 shadow-sm border border-cream-200 mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-sm text-clay-500">Order ID</div>
              <div className="font-display text-2xl font-bold text-tea-700">{order.order_number}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-clay-500">Estimated Time</div>
              <div className="flex items-center gap-1.5 font-bold text-amber-600">
                <Clock className="h-5 w-5" /> {order.estimated_minutes} Minutes
              </div>
            </div>
          </div>
        </motion.div>

        {isCancelled ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-red-50 border border-red-200 p-8 text-center"
          >
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-red-700">Sorry, Order Cancelled</h2>
            <p className="text-red-600 mt-2">Your order could not be processed. Please contact us for help.</p>
          </motion.div>
        ) : (
          <>
            {/* Status messages */}
            <AnimatePresence mode="wait">
              {order.status === 'pending' && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 mb-6 text-amber-800 font-medium flex items-center gap-2"
                >
                  <Clock className="h-5 w-5 animate-pulse" /> Waiting for confirmation…
                </motion.div>
              )}
              {order.status === 'accepted' && (
                <motion.div
                  key="accepted"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl bg-tea-50 border border-tea-200 px-5 py-4 mb-6 text-tea-800 font-medium flex items-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" /> Your Order has been Accepted — Preparing…
                </motion.div>
              )}
              {order.status === 'preparing' && (
                <motion.div
                  key="preparing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl bg-tea-50 border border-tea-200 px-5 py-4 mb-6"
                >
                  <div className="flex items-center gap-2 text-tea-800 font-medium mb-2">
                    <ChefHat className="h-5 w-5" /> Your Tea is Being Prepared
                  </div>
                  <button
                    onClick={() => setShowVideo(true)}
                    className="flex items-center gap-2 text-sm text-tea-600 font-semibold hover:underline"
                  >
                    <Play className="h-4 w-4" /> Watch Preparation
                  </button>
                </motion.div>
              )}
              {order.status === 'ready' && (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl bg-tea-50 border border-tea-200 px-5 py-4 mb-6 text-tea-800 font-medium flex items-center gap-2"
                >
                  <PackageCheck className="h-5 w-5" /> Your Order is Ready — Please Collect!
                </motion.div>
              )}
              {order.status === 'out_for_table' && (
                <motion.div
                  key="out"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl bg-tea-50 border border-tea-200 px-5 py-4 mb-6 text-tea-800 font-medium flex items-center gap-2"
                >
                  <Truck className="h-5 w-5" /> Out for Table — On the way to you!
                </motion.div>
              )}
              {order.status === 'delivered' && (
                <motion.div
                  key="delivered"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl bg-tea-50 border border-tea-200 px-5 py-4 mb-6 text-tea-800 font-medium flex items-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" /> Delivered — Enjoy your drink!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress tracker */}
            <div className="rounded-2xl bg-white p-8 shadow-sm border border-cream-200 mb-6">
              <h2 className="font-display text-xl font-bold text-clay-900 mb-8 text-center">Order Tracking</h2>
              <div className="relative">
                {/* Progress line */}
                <div className="absolute left-5 top-0 h-full w-0.5 bg-cream-200" />
                <motion.div
                  className="absolute left-5 top-0 w-0.5 bg-tea-500"
                  initial={{ height: 0 }}
                  animate={{ height: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                />
                <div className="space-y-6">
                  {STEPS.map((step, idx) => {
                    const Icon = STEP_ICONS[step];
                    const done = idx <= currentStepIndex;
                    const active = idx === currentStepIndex;
                    return (
                      <motion.div
                        key={step}
                        initial={{ opacity: done ? 1 : 0.5 }}
                        animate={{ opacity: done ? 1 : 0.5 }}
                        className="relative flex items-center gap-4"
                      >
                        <motion.div
                          animate={active ? { scale: [1, 1.15, 1] } : {}}
                          transition={active ? { duration: 1.5, repeat: Infinity } : {}}
                          className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${
                            done ? 'bg-tea-600 text-cream-50' : 'bg-cream-100 text-clay-400'
                          } ${active ? 'ring-4 ring-tea-100' : ''}`}
                        >
                          <Icon className="h-5 w-5" />
                        </motion.div>
                        <div>
                          <div className={`font-semibold ${done ? 'text-tea-800' : 'text-clay-400'}`}>
                            {STATUS_LABELS[step]}
                          </div>
                          {active && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-xs text-tea-600"
                            >
                              In progress…
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order details */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-cream-200 mb-6">
              <h3 className="font-display text-lg font-bold text-clay-900 mb-4">Order Details</h3>
              <div className="space-y-3">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.product_name} className="h-12 w-12 rounded-lg object-cover" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-clay-800">{item.product_name}</div>
                      <div className="text-sm text-clay-500">Qty: {item.quantity} · {inr2(item.price)} · GST {item.gst_percent}%</div>
                    </div>
                    <div className="font-semibold text-tea-700">
                      {inr2(item.price * item.quantity + (item.price * item.quantity * item.gst_percent) / 100)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-cream-200 pt-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-clay-600">Subtotal</span><span>{inr2(order.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-clay-600">GST</span><span>{inr2(order.gst_total)}</span></div>
                {order.discount > 0 && <div className="flex justify-between text-tea-600"><span>Discount</span><span>-{inr2(order.discount)}</span></div>}
                <div className="flex justify-between font-bold text-base pt-1"><span>Grand Total</span><span className="text-tea-700">{inr2(order.grand_total)}</span></div>
                <div className="flex justify-between text-xs text-clay-400 pt-2"><span>Placed at {formatTime(order.created_at)}</span><span>{order.payment_method}</span></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Preparation video modal */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowVideo(false)}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl overflow-hidden bg-black"
            >
              <div className="flex items-center justify-between bg-tea-900 px-4 py-3 text-cream-50">
                <span className="font-semibold flex items-center gap-2"><Coffee className="h-5 w-5" /> Preparation Video</span>
                <button onClick={() => setShowVideo(false)} className="text-cream-200 hover:text-white">✕</button>
              </div>
              <video
                ref={videoRef}
                autoPlay
                controls
                poster={prepVideo?.poster_url ?? undefined}
                className="w-full aspect-video"
              >
                {prepVideo && <source src={prepVideo.video_url} type="video/mp4" />}
              </video>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review modal */}
      <AnimatePresence>
        {showReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReview(false)}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
              <div className="text-center mb-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-3">
                  <Star className="h-8 w-8 fill-amber-400 text-amber-400" />
                </div>
                <h2 className="font-display text-2xl font-bold text-tea-900">Rate Your Order</h2>
                <p className="text-clay-600 text-sm mt-1">How was your experience?</p>
              </div>
              <div className="flex justify-center mb-4">
                <StarRating rating={reviewRating} size={36} interactive onChange={setReviewRating} />
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell us about your experience…"
                className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tea-400 min-h-24"
              />
              <button
                onClick={submitReview}
                disabled={submittingReview}
                className="mt-4 w-full rounded-xl bg-tea-600 px-6 py-3 font-semibold text-cream-50 hover:bg-tea-700 disabled:opacity-50 transition-colors"
              >
                {submittingReview ? 'Submitting…' : 'Submit Review'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
