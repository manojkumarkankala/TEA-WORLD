import { motion } from 'framer-motion';
import { Plus, Clock, Tag, Leaf } from 'lucide-react';
import type { Product } from '@/lib/supabase';
import { inr, lineTotal } from '@/lib/format';
import { StarRating } from './StarRating';
import { VegIcon } from './VegIcon';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const { toast } = useToast();

  const handleAdd = () => {
    if (product.stock <= 0) {
      toast('Out of stock', 'error');
      return;
    }
    add(product);
    toast(`${product.name} added to cart`);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-cream-200 hover:shadow-xl transition-shadow"
    >
      <div className="relative h-48 overflow-hidden bg-cream-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-clay-300">
            <Leaf className="h-12 w-12" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <VegIcon isVeg={product.is_veg} />
        </div>
        {product.offer_label && (
          <div className="absolute top-3 right-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow">
            {product.offer_label}
          </div>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-lg bg-white px-4 py-2 font-semibold text-red-600">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-clay-900">{product.name}</h3>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <StarRating rating={product.rating} size={14} />
          <span className="text-xs text-clay-500">{product.rating.toFixed(1)}</span>
        </div>
        <p className="mt-2 text-sm text-clay-600 leading-relaxed line-clamp-2">{product.description}</p>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-full bg-tea-50 px-2.5 py-1 text-tea-700">
            <Clock className="h-3 w-3" /> {product.prep_time_minutes} min
          </span>
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
            <Tag className="h-3 w-3" /> GST {product.gst_percent}%
          </span>
          <span className="rounded-full bg-cream-100 px-2.5 py-1 text-clay-600">
            Stock: {product.stock}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="font-display text-2xl font-bold text-tea-700">{inr(product.price)}</div>
            <div className="text-xs text-clay-500">incl. GST: {inr(lineTotal(product.price, 1, product.gst_percent))}</div>
          </div>
          <button
            onClick={handleAdd}
            disabled={product.stock <= 0}
            className="flex items-center gap-1.5 rounded-xl bg-tea-600 px-4 py-2.5 text-sm font-semibold text-cream-50 hover:bg-tea-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}
