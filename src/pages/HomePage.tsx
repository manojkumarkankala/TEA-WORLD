import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, MapPin, Phone, Star, ArrowRight, Quote, ChevronLeft, ChevronRight,
  Coffee, Tag, Sparkles, Award, Play,
} from 'lucide-react';
import { supabase, type Product, type Review, type ShopDetails, type Notification, type GalleryItem, type Offer } from '@/lib/supabase';
import { StarRating } from '@/components/StarRating';
import { inr } from '@/lib/format';

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: prods }, { data: revs }, { data: shopData }, { data: notifs }, { data: gal }, { data: offs }] = await Promise.all([
        supabase.from('products').select('*, categories(name, slug)').eq('is_available', true),
        supabase.from('reviews').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(6),
        supabase.from('shop_details').select('*').maybeSingle(),
        supabase.from('notifications').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('gallery').select('*').eq('section', 'shop').limit(6),
        supabase.from('offers').select('*').eq('is_active', true),
      ]);
      setProducts(prods ?? []);
      setReviews(revs ?? []);
      setShop(shopData as ShopDetails | null);
      setNotification(notifs as Notification | null);
      setGallery(gal ?? []);
      setOffers(offs ?? []);
      setLoading(false);
    })();
  }, []);

  const featured = products.filter((p) => p.is_featured).slice(0, 4);
  const popular = products.filter((p) => p.is_popular).slice(0, 4);
  const sliderImages = gallery.length > 0 ? gallery : [];

  useEffect(() => {
    if (sliderImages.length < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % sliderImages.length), 4000);
    return () => clearInterval(t);
  }, [sliderImages.length]);

  const hours: { day: string; hours: string | null }[] = [
    { day: 'Monday', hours: shop?.monday_hours ?? null },
    { day: 'Tuesday', hours: shop?.tuesday_hours ?? null },
    { day: 'Wednesday', hours: shop?.wednesday_hours ?? null },
    { day: 'Thursday', hours: shop?.thursday_hours ?? null },
    { day: 'Friday', hours: shop?.friday_hours ?? null },
    { day: 'Saturday', hours: shop?.saturday_hours ?? null },
    { day: 'Sunday', hours: shop?.sunday_hours ?? null },
  ];

  return (
    <div className="bg-cream-50">
      {/* Notification bar */}
      {notification && (
        <div className="bg-tea-700 text-cream-50 text-center text-sm py-2 px-4 font-medium">
          <span className="font-semibold">{notification.title}:</span> {notification.message}
        </div>
      )}

      {/* Hero */}
      <section className="relative h-[90vh] min-h-[600px] overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={featured[0]?.image_url ?? undefined}
          className="absolute inset-0 h-full w-full object-cover"
        >
          {shop?.hero_video_url && <source src={shop.hero_video_url} type="video/mp4" />}
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-tea-900/70 via-tea-900/50 to-tea-900/80" />
        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-start justify-center px-4 sm:px-6 text-cream-50">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/90 px-4 py-1.5 text-sm font-semibold text-white mb-4">
              <Sparkles className="h-4 w-4" /> Freshly Brewed Daily
            </span>
            <h1 className="font-display text-5xl sm:text-7xl font-bold leading-tight max-w-2xl">
              {shop?.name ?? 'Tea World'}
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-cream-100/90 max-w-xl leading-relaxed">
              {shop?.tagline ?? 'Brewed with love, served with a smile.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/menu"
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white hover:bg-amber-600 transition-colors shadow-lg"
              >
                Order Now <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/track"
                className="flex items-center gap-2 rounded-xl bg-cream-50/10 backdrop-blur border border-cream-50/30 px-6 py-3 font-semibold text-cream-50 hover:bg-cream-50/20 transition-colors"
              >
                Track Order
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tea preparation video */}
      <section className="py-16 bg-cream-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <span className="text-tea-600 font-semibold text-sm uppercase tracking-wider">Watch & Learn</span>
              <h2 className="font-display text-4xl font-bold text-tea-900 mt-2">The Art of Tea Preparation</h2>
              <p className="mt-4 text-clay-700 leading-relaxed">
                Every cup at Tea World is crafted with precision and passion. From selecting the finest leaves
                to the perfect brew time — experience the magic that goes into every sip.
              </p>
              <div className="mt-6 space-y-3">
                {['Hand-picked aromatic spices', 'Slow-brewed for perfect flavor', 'Served at the ideal temperature'].map((t) => (
                  <div key={t} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-tea-100 text-tea-700">
                      <Star className="h-3.5 w-3.5 fill-tea-600 text-tea-600" />
                    </span>
                    <span className="text-clay-700">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-video bg-clay-200">
              {shop?.prep_video_url ? (
                <video
                  controls
                  poster={featured[0]?.image_url ?? undefined}
                  className="h-full w-full object-cover"
                >
                  <source src={shop.prep_video_url} type="video/mp4" />
                </video>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-clay-400">
                  <Play className="h-16 w-16" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Image slider / gallery */}
      {sliderImages.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-display text-4xl font-bold text-tea-900 text-center mb-2">A Glimpse of Our Shop</h2>
            <p className="text-center text-clay-600 mb-8">Step into the warm and welcoming world of Tea World</p>
            <div className="relative rounded-2xl overflow-hidden shadow-xl h-[400px]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={slide}
                  src={sliderImages[slide].media_url}
                  alt={sliderImages[slide].title ?? 'Shop'}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              {sliderImages[slide].title && (
                <div className="absolute bottom-6 left-6 text-cream-50">
                  <h3 className="font-display text-2xl font-bold">{sliderImages[slide].title}</h3>
                </div>
              )}
              {sliderImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSlide((s) => (s - 1 + sliderImages.length) % sliderImages.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-cream-50/20 backdrop-blur text-cream-50 hover:bg-cream-50/40"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setSlide((s) => (s + 1) % sliderImages.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-cream-50/20 backdrop-blur text-cream-50 hover:bg-cream-50/40"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Featured drinks */}
      {featured.length > 0 && (
        <section className="py-16 bg-cream-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-amber-600 font-semibold text-sm uppercase tracking-wider">Chef's Picks</span>
                <h2 className="font-display text-4xl font-bold text-tea-900 mt-1">Featured Drinks</h2>
              </div>
              <Link to="/menu" className="flex items-center gap-1 text-tea-600 font-medium hover:gap-2 transition-all">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link to="/menu" className="block group">
                    <div className="relative h-56 rounded-2xl overflow-hidden shadow-md">
                      <img src={p.image_url ?? ''} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-cream-50">
                        <div className="flex items-center gap-2 mb-1">
                          <StarRating rating={p.rating} size={12} />
                        </div>
                        <h3 className="font-display text-xl font-bold">{p.name}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-amber-300 font-bold">{inr(p.price)}</span>
                          {p.offer_label && (
                            <span className="text-xs bg-amber-500 px-2 py-0.5 rounded-full">{p.offer_label}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Special offers */}
      {offers.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-display text-4xl font-bold text-tea-900 text-center mb-8">Special Offers</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {offers.map((o, i) => (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-tea-600 to-tea-800 p-6 text-cream-50 shadow-lg"
                >
                  <Tag className="absolute -right-4 -top-4 h-24 w-24 text-cream-50/10" />
                  <span className="text-xs uppercase tracking-wider text-amber-300 font-semibold">{o.offer_type.replace('_', ' ')}</span>
                  <h3 className="font-display text-2xl font-bold mt-2">{o.title}</h3>
                  <p className="mt-2 text-cream-100/80 text-sm">{o.description}</p>
                  {o.start_time && o.end_time && (
                    <div className="mt-4 flex items-center gap-1.5 text-sm text-amber-300">
                      <Clock className="h-4 w-4" /> {o.start_time} – {o.end_time}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular items */}
      {popular.length > 0 && (
        <section className="py-16 bg-cream-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-tea-600 font-semibold text-sm uppercase tracking-wider">Most Loved</span>
                <h2 className="font-display text-4xl font-bold text-tea-900 mt-1">Popular Items</h2>
              </div>
              <Link to="/menu" className="flex items-center gap-1 text-tea-600 font-medium hover:gap-2 transition-all">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {popular.map((p) => (
                <Link key={p.id} to="/menu" className="block group">
                  <div className="relative h-56 rounded-2xl overflow-hidden shadow-md">
                    <img src={p.image_url ?? ''} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-xs font-bold text-white">
                      <Award className="h-3 w-3" /> Popular
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-cream-50">
                      <h3 className="font-display text-xl font-bold">{p.name}</h3>
                      <span className="text-amber-300 font-bold">{inr(p.price)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-display text-4xl font-bold text-tea-900 text-center mb-2">Customer Ratings & Reviews</h2>
            <p className="text-center text-clay-600 mb-8">What our customers say about Tea World</p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl bg-white p-6 shadow-sm border border-cream-200"
                >
                  <Quote className="h-8 w-8 text-tea-200" />
                  <StarRating rating={r.rating} size={16} />
                  <p className="mt-3 text-clay-700 leading-relaxed">{r.description}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tea-600 font-bold text-cream-50">
                      {r.customer_name.charAt(0)}
                    </span>
                    <div>
                      <div className="font-semibold text-clay-900">{r.customer_name}</div>
                      <div className="text-xs text-clay-500">Verified Customer</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Location & contact */}
      <section className="py-16 bg-tea-900 text-cream-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl font-bold mb-6">Visit Us</h2>
            {shop?.map_embed_url && (
              <div className="rounded-2xl overflow-hidden shadow-xl h-64 mb-6">
                <iframe
                  src={shop.map_embed_url}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  title="Tea World Location"
                />
              </div>
            )}
            <div className="space-y-4">
              {shop?.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-amber-300 mt-0.5" />
                  <span className="text-cream-100/80">{shop.address}</span>
                </div>
              )}
              {shop?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-amber-300" />
                  <span className="text-cream-100/80">{shop.phone}</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-display text-2xl font-bold mb-6">Opening Hours</h3>
            <div className="rounded-2xl bg-tea-800 p-6 space-y-3">
              {hours.map((h) => (
                <div key={h.day} className="flex justify-between border-b border-tea-700 pb-2 last:border-0">
                  <span className="text-cream-100/80">{h.day}</span>
                  <span className="text-amber-300 font-medium">{h.hours ?? 'Closed'}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 text-amber-300">
              <Coffee className="h-5 w-5" />
              <span className="font-medium">Now Open — Come say hi!</span>
            </div>
          </div>
        </div>
      </section>

      {loading && <div className="text-center py-20 text-clay-500">Loading…</div>}
    </div>
  );
}
