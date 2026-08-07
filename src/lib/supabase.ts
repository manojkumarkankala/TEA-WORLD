import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  gst_percent: number;
  prep_time_minutes: number;
  is_veg: boolean;
  stock: number;
  image_url: string | null;
  video_url: string | null;
  offer_label: string | null;
  is_available: boolean;
  is_featured: boolean;
  is_popular: boolean;
  rating: number;
  categories?: { name: string; slug: string } | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  mobile_number: string;
  table_number: string | null;
  special_instructions: string | null;
  payment_method: string;
  status: string;
  subtotal: number;
  gst_total: number;
  discount: number;
  grand_total: number;
  coupon_code: string | null;
  estimated_minutes: number;
  rated: boolean;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
  gst_percent: number;
  image_url: string | null;
};

export type Review = {
  id: string;
  order_id: string | null;
  customer_name: string;
  rating: number;
  description: string | null;
  status: string;
  is_featured: boolean;
  created_at: string;
};

export type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_amount: number;
  max_discount: number;
  expiry_date: string | null;
  is_active: boolean;
  usage_count: number;
};

export type Offer = {
  id: string;
  title: string;
  description: string | null;
  offer_type: string;
  is_active: boolean;
  start_time: string | null;
  end_time: string | null;
};

export type GalleryItem = {
  id: string;
  title: string | null;
  media_url: string;
  media_type: string;
  section: string;
};

export type VideoItem = {
  id: string;
  title: string;
  category_slug: string | null;
  video_url: string;
  poster_url: string | null;
  sort_order: number;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
};

export type ShopDetails = {
  id: string;
  name: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  map_embed_url: string | null;
  hero_video_url: string | null;
  prep_video_url: string | null;
  monday_hours: string | null;
  tuesday_hours: string | null;
  wednesday_hours: string | null;
  thursday_hours: string | null;
  friday_hours: string | null;
  saturday_hours: string | null;
  sunday_hours: string | null;
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export const ORDER_STATUSES = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'out_for_table',
  'delivered',
  'cancelled',
] as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  accepted: 'Accepted',
  preparing: 'Tea is Being Prepared',
  ready: 'Your Order is Ready',
  out_for_table: 'Out for Table',
  delivered: 'Delivered',
  cancelled: 'Order Cancelled',
};
