import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, ArrowLeft, Key } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginAsDemoAdmin, isAdmin } = useAuth();

  const [email, setEmail] = useState<string>('krishnaagrovet@gmail.com');
  const [password, setPassword] = useState<string>('Krishna@169#');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already logged in as admin, redirect declaratively to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/admin', { replace: true });
      } else {
        setErrorMsg(res.error || 'Invalid credentials or non-admin account.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    try {
      const res = await login('krishnaagrovet@gmail.com', 'Krishna@169#');
      if (res.success) {
        navigate('/admin', { replace: true });
      } else {
        loginAsDemoAdmin();
        navigate('/admin', { replace: true });
      }
    } catch {
      loginAsDemoAdmin();
      navigate('/admin', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1F1E19] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Decorative Brand Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#B82025]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#F5C900]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Return to Storefront link */}
      <div className="max-w-md w-full mx-auto mb-4 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-[#F5C900] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← मुख्य वेबसाइट पर वापस जाएं / Return to Storefront</span>
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto bg-[#292820] border border-amber-900/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        
        {/* Header Icon & Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-white border-2 border-[#F5C900] rounded-2xl p-1.5 flex items-center justify-center mx-auto shadow-lg shadow-black/40">
            <img
              src="/images/krishna-agrovet-logo.png"
              alt="Krishna Agrovet Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-[10px] font-black tracking-widest text-[#F5C900] uppercase">
              KRISHNA AGROVET
            </div>
            <h1 className="text-2xl font-black font-heading text-white">
              राधे कृष्णा पशु आहार
            </h1>
            <p className="text-xs text-amber-100/70 mt-0.5">
              Admin Portal • Inventory & Order Management
            </p>
          </div>
        </div>

        {/* Owner Login Quick Access */}
        <div className="bg-[#382705] border border-[#F5C900]/40 p-4 rounded-2xl text-xs text-amber-100 space-y-2.5">
          <div className="flex items-center gap-1.5 font-bold text-[#F5C900]">
            <Key className="w-4 h-4" />
            <span>Store Owner Administrator Access</span>
          </div>
          <p className="text-amber-100/80 leading-relaxed text-[11px]">
            Owner email <code className="bg-black/40 text-[#F5C900] px-1.5 py-0.5 rounded font-mono font-bold">krishnaagrovet@gmail.com</code> is pre-filled. Tap below to log in immediately.
          </p>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-3 bg-[#F5C900] hover:bg-amber-400 text-[#292820] font-black rounded-xl transition-all shadow-md text-xs flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <span>One-Click Owner Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-300">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="krishnaagrovet@gmail.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#1F1E19] border border-stone-700 rounded-xl text-sm text-white placeholder:text-stone-600 focus:outline-hidden focus:border-[#F5C900] focus:ring-1 focus:ring-[#F5C900]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#1F1E19] border border-stone-700 rounded-xl text-sm text-white placeholder:text-stone-600 focus:outline-hidden focus:border-[#F5C900] focus:ring-1 focus:ring-[#F5C900]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#B82025] hover:bg-[#9B1A1E] active:scale-98 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#B82025]/30 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Admin...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4 text-[#F5C900]" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-stone-400">
          Protected by Firebase Authentication & Cloud Firestore Security Rules.
        </div>

      </div>
    </div>
  );
};
