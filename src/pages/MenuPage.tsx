import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Leaf } from 'lucide-react';
import { supabase, type Product, type Category } from '@/lib/supabase';
import { ProductCard } from '@/components/ProductCard';

export function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from('products').select('*, categories(name, slug)').eq('is_available', true),
        supabase.from('categories').select('*').order('sort_order'),
      ]);
      setProducts(prods ?? []);
      setCategories(cats ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = products.filter((p) => {
    if (activeCat !== 'all') {
      const cat = categories.find((c) => c.slug === activeCat);
      if (p.categories?.slug !== activeCat && p.category_id !== cat?.id) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.description ?? '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const catTabs = [{ slug: 'all', name: 'All', icon: null }, ...categories];

  return (
    <div className="bg-cream-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-tea-700 to-tea-900 text-cream-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-5xl font-bold">Our Menu</h1>
            <p className="mt-3 text-cream-100/80 text-lg">Discover your perfect cup</p>
          </motion.div>
        </div>
      </div>

      {/* Search */}
      <div className="sticky top-16 z-30 bg-cream-50/90 backdrop-blur-md border-b border-cream-200 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-clay-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drinks…"
              className="w-full rounded-xl border border-cream-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-tea-400"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1">
            {catTabs.map((c) => (
              <button
                key={c.slug}
                onClick={() => setActiveCat(c.slug)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCat === c.slug
                    ? 'bg-tea-600 text-cream-50'
                    : 'bg-cream-100 text-clay-700 hover:bg-tea-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-cream-200 overflow-hidden">
                <div className="h-48 skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-2/3 skeleton rounded" />
                  <div className="h-4 w-full skeleton rounded" />
                  <div className="h-10 w-full skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Leaf className="h-16 w-16 text-tea-200 mx-auto mb-4" />
            <p className="text-clay-600 text-lg">No drinks found. Try a different search.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-clay-500 mb-6">{filtered.length} items</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.4) }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
