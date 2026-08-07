import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag, Percent, History, MapPin, Zap, Heart, Gift, LogIn, UserPlus, Mail, Lock,
  Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const BENEFITS = [
  { icon: Tag, title: 'Exclusive Coupons', desc: 'Access member-only discount codes' },
  { icon: Percent, title: 'Special Discounts', desc: 'Save more on every order' },
  { icon: History, title: 'Order History', desc: 'Reorder your favorites easily' },
  { icon: MapPin, title: 'Saved Address', desc: 'Faster checkout with saved details' },
  { icon: Zap, title: 'Faster Checkout', desc: 'Skip the form, order in seconds' },
  { icon: Heart, title: 'Favorite Drinks', desc: 'Bookmark drinks you love' },
  { icon: Gift, title: 'Reward Points', desc: 'Earn points on every purchase' },
];

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast('Please enter email and password', 'error');
      return;
    }
    setLoading(true);
    const fn = mode === 'login' ? signIn : signUp;
    const { error } = await fn(email.trim(), password);
    setLoading(false);
    if (error) {
      toast(error, 'error');
      return;
    }
    if (mode === 'signup') {
      toast('Account created! You are now logged in.');
    } else {
      toast('Welcome back!');
    }
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream-50 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 grid gap-8 lg:grid-cols-2 items-start">
        {/* Benefits */}
        <div className="hidden lg:block">
          <h1 className="font-display text-4xl font-bold text-tea-900 mb-2">Customer Benefits</h1>
          <p className="text-clay-600 mb-8">Login to unlock exclusive perks and rewards</p>
          <div className="space-y-3">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm border border-cream-200"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tea-50 text-tea-600">
                  <b.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-semibold text-clay-900">{b.title}</div>
                  <div className="text-sm text-clay-500">{b.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Auth form */}
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-cream-200">
          <div className="flex gap-2 mb-6 p-1 bg-cream-100 rounded-xl">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                mode === 'login' ? 'bg-tea-600 text-cream-50 shadow' : 'text-clay-600'
              }`}
            >
              <LogIn className="h-4 w-4" /> Login
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                mode === 'signup' ? 'bg-tea-600 text-cream-50 shadow' : 'text-clay-600'
              }`}
            >
              <UserPlus className="h-4 w-4" /> Sign Up
            </button>
          </div>

          <h2 className="font-display text-2xl font-bold text-tea-900 mb-1">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-clay-500 mb-6">
            {mode === 'login' ? 'Login to enjoy member benefits' : 'Sign up to start earning rewards'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="flex items-center gap-1.5 text-sm font-medium text-clay-700 mb-1.5">
                <Mail className="h-4 w-4" /> Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tea-400"
              />
            </label>
            <label className="block">
              <span className="flex items-center gap-1.5 text-sm font-medium text-clay-700 mb-1.5">
                <Lock className="h-4 w-4" /> Password
              </span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-cream-200 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-tea-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-clay-400 hover:text-tea-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-tea-600 px-6 py-3.5 font-semibold text-cream-50 hover:bg-tea-700 disabled:opacity-50 transition-colors shadow"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-cream-200">
            <p className="text-xs text-clay-500 text-center">
              Are you the shop admin? <Link to="/admin/login" className="text-tea-600 font-semibold hover:underline">Admin Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
