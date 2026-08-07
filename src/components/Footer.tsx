import { Link } from 'react-router-dom';
import { Coffee, Phone, Mail, MapPin, Share2, Globe, MessageCircle } from 'lucide-react';
import type { ShopDetails } from '@/lib/supabase';

export function Footer({ shop }: { shop: ShopDetails | null }) {
  return (
    <footer className="bg-tea-900 text-cream-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tea-600 text-cream-50">
              <Coffee className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-bold">Tea World</span>
          </div>
          <p className="text-sm text-cream-200/70 leading-relaxed">
            {shop?.tagline ?? 'Brewed with love, served with a smile.'}
          </p>
          <div className="flex gap-3 mt-4">
            {[Share2, Globe, MessageCircle].map((Icon, i) => (
              <span key={i} className="flex h-9 w-9 items-center justify-center rounded-full bg-tea-800 hover:bg-tea-600 cursor-pointer transition-colors">
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-cream-200/70">
            <li><Link to="/" className="hover:text-amber-300">Home</Link></li>
            <li><Link to="/menu" className="hover:text-amber-300">Menu</Link></li>
            <li><Link to="/track" className="hover:text-amber-300">Track Order</Link></li>
            <li><Link to="/login" className="hover:text-amber-300">Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-cream-200/70">
            {shop?.phone && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-amber-300" /> {shop.phone}
              </li>
            )}
            {shop?.email && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-300" /> {shop.email}
              </li>
            )}
            {shop?.address && (
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-amber-300 mt-0.5" /> {shop.address}
              </li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Opening Hours</h4>
          <ul className="space-y-1 text-sm text-cream-200/70">
            <li className="flex justify-between"><span>Mon–Thu</span><span>{shop?.monday_hours ?? '8 AM – 10 PM'}</span></li>
            <li className="flex justify-between"><span>Fri</span><span>{shop?.friday_hours ?? '8 AM – 11 PM'}</span></li>
            <li className="flex justify-between"><span>Sat</span><span>{shop?.saturday_hours ?? '9 AM – 11 PM'}</span></li>
            <li className="flex justify-between"><span>Sun</span><span>{shop?.sunday_hours ?? '9 AM – 9 PM'}</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-tea-800 py-4 text-center text-xs text-cream-200/50">
        © {new Date().getFullYear()} Tea World. All rights reserved.
      </div>
    </footer>
  );
}
