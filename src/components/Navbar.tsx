import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Coffee, ShoppingCart, Menu as MenuIcon, X, LogIn, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const { totalItems } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/menu', label: 'Menu' },
    { to: '/track', label: 'Track Order' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-cream-50/90 backdrop-blur-md border-b border-cream-200">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tea-600 text-cream-50 shadow-md">
            <Coffee className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold text-tea-800">Tea World</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'text-tea-700 bg-tea-50' : 'text-clay-700 hover:text-tea-600 hover:bg-cream-100'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-cream-100 text-clay-700 hover:bg-tea-50 hover:text-tea-600 transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-white"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {user ? (
            <div className="hidden md:flex items-center gap-1">
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 rounded-lg bg-tea-600 px-4 py-2 text-sm font-medium text-cream-50 hover:bg-tea-700 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              ) : (
                <Link
                  to="/account"
                  className="flex items-center gap-1.5 rounded-lg bg-cream-100 px-4 py-2 text-sm font-medium text-clay-700 hover:bg-tea-50 transition-colors"
                >
                  <User className="h-4 w-4" /> Account
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-100 text-clay-700 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden md:flex items-center gap-1.5 rounded-lg bg-tea-600 px-4 py-2 text-sm font-medium text-cream-50 hover:bg-tea-700 transition-colors"
            >
              <LogIn className="h-4 w-4" /> Login
            </Link>
          )}

          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full bg-cream-100 text-clay-700"
          >
            {open ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-cream-200 bg-cream-50"
          >
            <div className="flex flex-col gap-1 p-4">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-lg font-medium ${isActive ? 'bg-tea-50 text-tea-700' : 'text-clay-700 hover:bg-cream-100'}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              {user ? (
                <>
                  {isAdmin ? (
                    <Link to="/admin" onClick={() => setOpen(false)} className="px-4 py-3 rounded-lg font-medium bg-tea-600 text-cream-50">
                      Admin Dashboard
                    </Link>
                  ) : (
                    <Link to="/account" onClick={() => setOpen(false)} className="px-4 py-3 rounded-lg font-medium bg-tea-50 text-tea-700">
                      My Account
                    </Link>
                  )}
                  <button onClick={() => { setOpen(false); handleSignOut(); }} className="px-4 py-3 rounded-lg font-medium text-left text-red-500 hover:bg-red-50">
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="px-4 py-3 rounded-lg font-medium bg-tea-600 text-cream-50">
                  Login / Sign Up
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
