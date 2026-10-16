import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { 
  LayoutDashboard, Package, Boxes, 
  Settings, LogOut, Menu, X, Shield, ChevronRight, Store, ArrowLeft 
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, loading, logout } = useAuth();
  const { settings } = useStoreSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Auth Guard
  if (loading) {
    return (
      <div className="min-h-screen bg-deep-charcoal flex items-center justify-center text-white">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-400">Verifying administrator authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    navigate('/admin/login', { replace: true });
    return null;
  }

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Products & Packaging', href: '/admin/products', icon: Package },
    { label: 'Inventory & Stock', href: '/admin/inventory', icon: Boxes },
    { label: 'Store Settings', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-warm-cream/50 flex flex-col md:flex-row">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-deep-charcoal text-stone-200 border-r border-stone-800 shrink-0">
        
        {/* Brand Banner */}
        <div className="p-4 border-b border-stone-800 flex items-center gap-3">
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.business_name}
              className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border-2 border-brand-yellow shadow-md shrink-0"
            />
          ) : (
            <img
              src="/images/krishna-agrovet-logo.png"
              alt="Krishna Agrovet Logo"
              className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border-2 border-brand-yellow shadow-md shrink-0"
            />
          )}
          <div className="min-w-0 flex flex-col justify-center">
            <img
              src="/images/radhe-krishna-transparent-wordmark.png"
              alt="राधे कृष्णा पशु आहार"
              className="h-7 w-auto max-w-[155px] object-contain filter brightness-110 drop-shadow-xs"
            />
            <span className="text-[10px] text-brand-yellow font-black flex items-center gap-1 uppercase tracking-wider mt-0.5 whitespace-nowrap">
              <Shield className="w-3 h-3 text-brand-yellow shrink-0" /> KRISHNA AGROVET PORTAL
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  active
                    ? 'bg-krishna-red text-white shadow-sm border border-brand-yellow/30'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-brand-yellow' : 'text-stone-500'}`} />
                  <span>{item.label}</span>
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 text-brand-yellow" />}
              </Link>
            );
          })}
        </nav>

        {/* Storefront Link & Admin User Info */}
        <div className="p-4 border-t border-stone-800 space-y-3 bg-black/40">
          <Link
            to="/"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-bold transition-colors border border-stone-700"
          >
            <div className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-brand-yellow" />
              <span>Customer Storefront</span>
            </div>
            <ArrowLeft className="w-3.5 h-3.5 text-stone-400 rotate-180" />
          </Link>

          <div className="flex items-center justify-between pt-1">
            <div className="truncate pr-2">
              <span className="block text-xs font-bold text-white truncate">
                {user?.email || 'Store Owner'}
              </span>
              <span className="text-[10px] text-brand-yellow font-semibold uppercase">
                Administrator
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              title="Logout from admin portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* Mobile Top Header for Admin */}
      <div className="md:hidden bg-deep-charcoal text-white p-3.5 px-4 flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-2.5 min-w-0">
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.business_name}
              className="w-9 h-9 rounded-lg object-contain bg-white p-0.5 border border-brand-yellow shrink-0"
            />
          ) : (
            <img
              src="/images/krishna-agrovet-logo.png"
              alt="Krishna Agrovet Logo"
              className="w-9 h-9 rounded-lg object-contain bg-white p-0.5 border border-brand-yellow shrink-0"
            />
          )}
          <div className="flex flex-col justify-center min-w-0">
            <img
              src="/images/radhe-krishna-transparent-wordmark.png"
              alt="राधे कृष्णा पशु आहार"
              className="h-6 w-auto max-w-[140px] object-contain filter brightness-110 drop-shadow-xs"
            />
            <span className="text-[9.5px] text-brand-yellow font-bold uppercase flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-brand-yellow shrink-0" /> KRISHNA AGROVET PORTAL
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
          aria-label="Toggle navigation"
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileNavOpen && (
        <div className="md:hidden bg-deep-charcoal border-b border-stone-800 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold ${
                  active ? 'bg-krishna-red text-white' : 'text-stone-300 hover:bg-stone-800'
                }`}
              >
                <Icon className="w-4 h-4 text-brand-yellow" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
            <Link
              to="/"
              onClick={() => setMobileNavOpen(false)}
              className="text-xs text-brand-yellow font-bold flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5" />
              <span>View Customer Storefront</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-rose-400 font-bold"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Content Container */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
};
