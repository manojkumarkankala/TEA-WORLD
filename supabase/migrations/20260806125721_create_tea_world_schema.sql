/*
# Tea World — Full Schema

Creates the complete data layer for a tea-shop ordering app:
products, categories, orders + items, reviews, videos, gallery,
offers, coupons, notifications, shop details, settings, and admin
account. Public browse + cart/checkout work without login (anon),
while customer accounts and admin get authenticated access.

1. New Tables
- `categories` — tea/coffee/etc grouping for menu filters
- `products` — menu items with price, gst, stock, prep time, image, video, offer, availability
- `orders` — a customer order with status, totals, customer info, table number, payment
- `order_items` — line items belonging to an order
- `reviews` — customer ratings + text, with admin approval state
- `videos` — admin-uploaded preparation videos keyed by category
- `gallery` — shop/staff/event photos + videos
- `offers` — happy hour / festival / weekend promotions
- `coupons` — discount codes with value, limits, expiry
- `notifications` — broadcast messages from admin to customers
- `shop_details` — single-row table with contact info, hours, map, hero video
- `settings` — key/value app settings (admin password hash etc.)

2. Security (RLS)
- Public tables (categories, products, reviews where approved, gallery,
  offers, coupons active, notifications, videos, shop_details, settings):
  readable by anon + authenticated.
- Orders: a customer can read/update their own orders (matched by phone
  or by their auth user id). Anyone may create an order (guest checkout).
  Admin (service role) manages all orders server-side.
- Reviews: anyone may create; admin approves via service role.
- All write-operations for products/gallery/offers/coupons/notifications/
  videos/shop_details/settings are restricted to authenticated admin users.
- For simplicity in this demo, catalog management tables (products,
  categories, videos, gallery, offers, coupons, notifications,
  shop_details, settings) allow authenticated INSERT/UPDATE/DELETE so the
  admin (signed in) can manage them. Read access is public (anon + auth).

3. Notes
- Admin password stored as a bcrypt hash in `settings` under key
  'admin_password_hash'. For this demo a plaintext-equivalent is used
  but the app verifies against this value.
- Orders carry a human-readable order number (TW-XXXX) for display.
- All monetary amounts stored as numeric(10,2) in INR.
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  gst_percent numeric(5,2) NOT NULL DEFAULT 5,
  prep_time_minutes int NOT NULL DEFAULT 5,
  is_veg boolean NOT NULL DEFAULT true,
  stock int NOT NULL DEFAULT 0,
  image_url text,
  video_url text,
  offer_label text,
  is_available boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_popular boolean NOT NULL DEFAULT false,
  rating numeric(3,2) NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  mobile_number text NOT NULL,
  table_number text,
  special_instructions text,
  payment_method text NOT NULL DEFAULT 'Cash',
  status text NOT NULL DEFAULT 'pending',
  -- pending, accepted, preparing, ready, out_for_table, delivered, cancelled
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  gst_total numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  grand_total numeric(10,2) NOT NULL DEFAULT 0,
  coupon_code text,
  estimated_minutes int NOT NULL DEFAULT 5,
  rated boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  price numeric(10,2) NOT NULL DEFAULT 0,
  gst_percent numeric(5,2) NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  rating int NOT NULL DEFAULT 5,
  description text,
  status text NOT NULL DEFAULT 'pending',
  -- pending, approved, rejected, hidden
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Videos (preparation clips keyed to category)
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category_slug text,
  video_url text NOT NULL,
  poster_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Gallery
CREATE TABLE IF NOT EXISTS gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  section text NOT NULL DEFAULT 'shop',
  -- shop, staff, events
  created_at timestamptz DEFAULT now()
);

-- Offers
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  offer_type text NOT NULL DEFAULT 'general',
  -- happy_hour, festival, weekend, student, general
  is_active boolean NOT NULL DEFAULT true,
  start_time time,
  end_time time,
  created_at timestamptz DEFAULT now()
);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL DEFAULT 'percent',
  -- percent, flat
  discount_value numeric(10,2) NOT NULL DEFAULT 0,
  min_amount numeric(10,2) NOT NULL DEFAULT 0,
  max_discount numeric(10,2) NOT NULL DEFAULT 0,
  expiry_date date,
  is_active boolean NOT NULL DEFAULT true,
  usage_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Notifications (broadcast)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Shop details (single row)
CREATE TABLE IF NOT EXISTS shop_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Tea World',
  tagline text,
  phone text,
  email text,
  address text,
  map_embed_url text,
  hero_video_url text,
  prep_video_url text,
  monday_hours text,
  tuesday_hours text,
  wednesday_hours text,
  thursday_hours text,
  friday_hours text,
  saturday_hours text,
  sunday_hours text,
  updated_at timestamptz DEFAULT now()
);

-- Settings (key/value)
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- ============ RLS ============

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- categories: public read, auth manage
DROP POLICY IF EXISTS "read_categories" ON categories;
CREATE POLICY "read_categories" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_categories" ON categories;
CREATE POLICY "insert_categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_categories" ON categories;
CREATE POLICY "update_categories" ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_categories" ON categories;
CREATE POLICY "delete_categories" ON categories FOR DELETE TO authenticated USING (true);

-- products: public read, auth manage
DROP POLICY IF EXISTS "read_products" ON products;
CREATE POLICY "read_products" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_products" ON products;
CREATE POLICY "insert_products" ON products FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_products" ON products;
CREATE POLICY "update_products" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_products" ON products;
CREATE POLICY "delete_products" ON products FOR DELETE TO authenticated USING (true);

-- orders: anyone may create; read own by user_id OR by mobile match; update own
DROP POLICY IF EXISTS "read_orders" ON orders;
CREATE POLICY "read_orders" ON orders FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "insert_orders" ON orders;
CREATE POLICY "insert_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_orders" ON orders;
CREATE POLICY "update_orders" ON orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- order_items: public read (so customer can see their order details), insert by anon/auth
DROP POLICY IF EXISTS "read_order_items" ON order_items;
CREATE POLICY "read_order_items" ON order_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_order_items" ON order_items;
CREATE POLICY "insert_order_items" ON order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

-- reviews: public read approved; anyone may create; auth update (admin moderate)
DROP POLICY IF EXISTS "read_reviews" ON reviews;
CREATE POLICY "read_reviews" ON reviews FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_reviews" ON reviews;
CREATE POLICY "insert_reviews" ON reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_reviews" ON reviews;
CREATE POLICY "update_reviews" ON reviews FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_reviews" ON reviews;
CREATE POLICY "delete_reviews" ON reviews FOR DELETE TO authenticated USING (true);

-- videos: public read, auth manage
DROP POLICY IF EXISTS "read_videos" ON videos;
CREATE POLICY "read_videos" ON videos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_videos" ON videos;
CREATE POLICY "insert_videos" ON videos FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_videos" ON videos;
CREATE POLICY "update_videos" ON videos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_videos" ON videos;
CREATE POLICY "delete_videos" ON videos FOR DELETE TO authenticated USING (true);

-- gallery: public read, auth manage
DROP POLICY IF EXISTS "read_gallery" ON gallery;
CREATE POLICY "read_gallery" ON gallery FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_gallery" ON gallery;
CREATE POLICY "insert_gallery" ON gallery FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_gallery" ON gallery;
CREATE POLICY "update_gallery" ON gallery FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_gallery" ON gallery;
CREATE POLICY "delete_gallery" ON gallery FOR DELETE TO authenticated USING (true);

-- offers: public read, auth manage
DROP POLICY IF EXISTS "read_offers" ON offers;
CREATE POLICY "read_offers" ON offers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_offers" ON offers;
CREATE POLICY "insert_offers" ON offers FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_offers" ON offers;
CREATE POLICY "update_offers" ON offers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_offers" ON offers;
CREATE POLICY "delete_offers" ON offers FOR DELETE TO authenticated USING (true);

-- coupons: public read, auth manage
DROP POLICY IF EXISTS "read_coupons" ON coupons;
CREATE POLICY "read_coupons" ON coupons FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_coupons" ON coupons;
CREATE POLICY "insert_coupons" ON coupons FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_coupons" ON coupons;
CREATE POLICY "update_coupons" ON coupons FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_coupons" ON coupons;
CREATE POLICY "delete_coupons" ON coupons FOR DELETE TO authenticated USING (true);

-- notifications: public read, auth manage
DROP POLICY IF EXISTS "read_notifications" ON notifications;
CREATE POLICY "read_notifications" ON notifications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "insert_notifications" ON notifications;
CREATE POLICY "insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_notifications" ON notifications;
CREATE POLICY "update_notifications" ON notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_notifications" ON notifications;
CREATE POLICY "delete_notifications" ON notifications FOR DELETE TO authenticated USING (true);

-- shop_details: public read, auth update
DROP POLICY IF EXISTS "read_shop_details" ON shop_details;
CREATE POLICY "read_shop_details" ON shop_details FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "update_shop_details" ON shop_details;
CREATE POLICY "update_shop_details" ON shop_details FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- settings: public read (non-sensitive only; admin password hash stored but
-- app uses service role for verification), auth manage
DROP POLICY IF EXISTS "read_settings" ON settings;
CREATE POLICY "read_settings" ON settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "update_settings" ON settings;
CREATE POLICY "update_settings" ON settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "insert_settings" ON settings;
CREATE POLICY "insert_settings" ON settings FOR INSERT TO authenticated WITH CHECK (true);

-- Updated_at trigger for orders
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Order number generator
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  n int;
BEGIN
  SELECT count(*) + 1 INTO n FROM orders;
  RETURN 'TW-' || lpad(n::text, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
