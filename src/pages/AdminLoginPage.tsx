import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Shield, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

const ADMIN_EMAIL = 'admin@teaworld.in';
const ADMIN_AUTH_PASS = 'TEAWORLD@123';
const ADMIN_SESSION_KEY = 'tw_admin_session';

export function AdminLoginPage() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  // Once the auth context confirms admin status, go to the dashboard.
  // Waiting here avoids the race where navigate fires before
  // onAuthStateChange updates isAdmin.
  useEffect(() => {
    if (authenticating && isAdmin) {
      setAuthenticating(false);
      setLoading(false);
      toast('Admin login successful');
      navigate('/admin', { replace: true });
    }
  }, [authenticating, isAdmin, navigate, toast]);

  // Safety timeout
  useEffect(() => {
    if (!authenticating) return;
    const t = setTimeout(() => {
      setAuthenticating(false);
      setLoading(false);
      toast('Login timed out — please try again', 'error');
    }, 10000);
    return () => clearTimeout(t);
  }, [authenticating]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast('Please enter the password', 'error');
      return;
    }
    setLoading(true);

    // Step 1: verify the entered password against the settings table
    const { data: setting, error: settingsErr } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'admin_password')
      .maybeSingle();

    if (settingsErr || !setting || setting.value !== password) {
      toast('Invalid password', 'error');
      setLoading(false);
      return;
    }

    // Step 2: sign in with the admin Supabase Auth account so that RLS
    // allows writes. If the account doesn't exist yet, create it first.
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_AUTH_PASS,
    });

    if (!signInErr) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setAuthenticating(true);
      return;
    }

    // Account doesn't exist — create it, then sign in
    const { error: signUpErr } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_AUTH_PASS,
    });

    if (signUpErr) {
      toast('Could not create admin account: ' + signUpErr.message, 'error');
      setLoading(false);
      return;
    }

    const { error: signIn2 } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_AUTH_PASS,
    });

    if (signIn2) {
      toast('Account created but sign-in failed: ' + signIn2.message, 'error');
      setLoading(false);
      return;
    }

    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    setAuthenticating(true);
  };

  return (
    <div className="min-h-screen bg-tea-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center gap-1 text-cream-200/70 hover:text-cream-50 mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
        <div className="rounded-2xl bg-cream-50 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-tea-600 text-cream-50 mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl font-bold text-tea-900">Admin Login</h1>
            <p className="text-clay-600 text-sm mt-1">Tea World Management Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="flex items-center gap-1.5 text-sm font-medium text-clay-700 mb-1.5">
                <Lock className="h-4 w-4" /> Admin Password
              </span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full rounded-xl border border-cream-200 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-tea-400"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-clay-400 hover:text-tea-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-tea-600 px-6 py-3.5 font-semibold text-cream-50 hover:bg-tea-700 disabled:opacity-50 transition-colors shadow flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Verifying…</> : 'Login to Dashboard'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-clay-400">
            Demo password: <span className="font-mono font-semibold text-clay-600">only admin can open</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
