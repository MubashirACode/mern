'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, Zap, Shield, ArrowRight, Layers,
  CheckCircle2, MessageSquare, BarChart3, Globe, Lock,
  Users, Headphones, Star, X 
} from 'lucide-react';

import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

/* ─── Navbar ─────────────────────────────────────────────────────── */
export function Navbar() {
  const { user, logout } = useAuthStore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 font-sans ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm' 
          : 'bg-white/70 backdrop-blur-xl'
      }`}>
        <div className="max-w-[1140px] mx-auto h-16 px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Headphones size={18} color="#fff" />
            </div>
            <span className="text-2xl font-bold tracking-tighter text-gray-950">SupportFlow</span>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            {['Features', 'Pricing', 'Docs', 'Blog'].map((item) => (
              <a key={item} href="#" className="hover:text-gray-900 transition-colors">
                {item}
              </a>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm hidden sm:block">{user.name}</span>
                </div>
                <button 
                  onClick={logout}
                  className="px-5 py-2 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition hidden sm:block"
                >
                  Login
                </button>
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl flex items-center gap-2 transition shadow-lg shadow-blue-500/30"
                >
                  Get started <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}

/* ─── Custom Auth Modal ──────────────────────────────────────────── */
function AuthModal({ isOpen, onClose }) {
  const { login, signup } = useAuthStore();
  const [tab, setTab] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (tab === 'login') {
        await login({ email: formData.email, password: formData.password });
      } else {
        await signup(formData);
      }
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="relative p-8 pb-0 text-center">
                <button 
                  onClick={onClose}
                  className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={22} />
                </button>

                <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                  <Headphones size={28} color="#fff" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome to SupportFlow</h2>
                <p className="text-gray-500 mt-2">Sign in or create your account</p>
              </div>

              {/* Tabs */}
              <div className="px-8 pt-8">
                <div className="flex bg-gray-100 rounded-2xl p-1">
                  <button
                    onClick={() => setTab('login')}
                    className={`flex-1 py-3 text-sm font-semibold rounded-xl transition ${
                      tab === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setTab('signup')}
                    className={`flex-1 py-3 text-sm font-semibold rounded-xl transition ${
                      tab === 'signup' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="p-8 space-y-5">
                {tab === 'signup' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-12 px-4 rounded-2xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
                      placeholder="John Doe"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-12 px-4 rounded-2xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
                    placeholder="name@company.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full h-12 px-4 rounded-2xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
                    placeholder={tab === 'login' ? "Enter password" : "Create password"}
                  />
                </div>

                {tab === 'signup' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">Account Type</label>
                    <div className="flex gap-3">
                      {['user', 'admin'].map((role) => (
                        <label
                          key={role}
                          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border cursor-pointer transition-all ${
                            formData.role === role 
                              ? 'border-blue-600 bg-blue-50 text-blue-700' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            checked={formData.role === role}
                            onChange={() => setFormData({ ...formData, role })}
                            className="hidden"
                          />
                          {role === 'user' ? <Users size={18} /> : <Shield size={18} />}
                          <span className="font-medium capitalize">{role}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-12 mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-2xl transition flex items-center justify-center"
                >
                  {loading 
                    ? (tab === 'login' ? 'Signing in...' : 'Creating account...') 
                    : (tab === 'login' ? 'Sign In' : 'Create Account')
                  }
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Hero Section ───────────────────────────────────────────────── */
export function Hero() {
  return (
    <section className="relative pt-24 pb-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-white overflow-hidden font-sans border-b">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(#3b82f620_1px,transparent_1px),linear-gradient(90deg,#3b82f620_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="max-w-[1140px] mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-5 py-2 mb-8">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                <Zap size={11} color="#fff" fill="#fff" />
              </div>
              <span className="text-xs font-bold tracking-widest text-gray-600">NOW IN BETA — EARLY ACCESS OPEN</span>
            </div>

            <h1 className="text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.05] text-gray-950 mb-6">
              Support that <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">scales with you.</span>
            </h1>

            <p className="text-lg text-gray-600 max-w-lg mb-10">
              Real-time customer support infrastructure for modern SaaS teams. 
              Manage tickets, monitor orders, and resolve issues — all in one place.
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl flex items-center gap-3 transition shadow-xl shadow-blue-500/30">
                Start free trial <ArrowRight size={18} />
              </button>
              <button className="px-8 py-4 border border-gray-300 hover:bg-gray-50 rounded-2xl font-medium text-gray-700 transition">
                View demo
              </button>
            </div>

            {/* Trust */}
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-4">
                {['A','B','C','D'].map((l, i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white" 
                       style={{ background: `hsl(${200 + i*30}, 70%, 55%)` }}>
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-px">
                  {[1,2,3,4,5].map(i => <Star key={i} size={15} className="text-amber-500 fill-current" />)}
                </div>
                <p className="text-sm text-gray-500 mt-1">Trusted by 2,400+ teams</p>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden">
              {/* Browser Bar */}
              <div className="h-11 bg-gray-50 border-b px-4 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 h-6 mx-3 bg-gray-100 rounded flex items-center px-3">
                  <span className="text-xs text-gray-400 font-mono">app.supportflow.io/dashboard</span>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Open tickets', value: '24', color: 'text-blue-600' },
                    { label: 'Resolved today', value: '138', color: 'text-emerald-600' },
                    { label: 'Avg response', value: '2.4m', color: 'text-amber-600' },
                  ].map((s, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                      <p className="text-xs text-gray-500">{s.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Live Tickets */}
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b flex justify-between items-center text-xs font-semibold">
                    <span>Live Tickets</span>
                    <div className="flex items-center gap-2 text-emerald-600">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> LIVE
                    </div>
                  </div>

                  {[
                    { user: 'Ahmad K.', issue: 'Billing question', status: 'In Progress', color: 'bg-blue-100 text-blue-700' },
                    { user: 'Sara M.', issue: 'API integration', status: 'Pending', color: 'bg-amber-100 text-amber-700' },
                    { user: 'James L.', issue: 'Account access', status: 'Resolved', color: 'bg-emerald-100 text-emerald-700' },
                  ].map((t, i) => (
                    <div key={i} className="px-5 py-4 border-b last:border-none flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                          {t.user[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{t.user}</p>
                          <p className="text-xs text-gray-500">{t.issue}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-4 py-1 rounded-full ${t.color}`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Feature Section ────────────────────────────────────────────── */
function FeatureSection() {
  const features = [
    { icon: MessageSquare, title: 'Intelligent chat routing', desc: 'AI-powered triage connects customers with the right agent instantly.', color: 'text-blue-600' },
    { icon: BarChart3, title: 'Real-time analytics', desc: 'Monitor response times, CSAT scores, and ticket volumes with live dashboards.', color: 'text-indigo-600' },
    { icon: Shield, title: 'Enterprise-grade SLAs', desc: 'Configurable SLA policies with automated escalations.', color: 'text-emerald-600' },
    { icon: Zap, title: 'Instant notifications', desc: 'Real-time alerts across Slack, email, and mobile.', color: 'text-amber-600' },
    { icon: Globe, title: 'Global infrastructure', desc: '99.9% uptime SLA with multi-region deployment.', color: 'text-cyan-600' },
    { icon: Lock, title: 'SOC 2 Type II certified', desc: 'Bank-grade encryption and full audit logs.', color: 'text-rose-600' },
  ];

  return (
    <section className="py-24 bg-[#FAFBFE]">
      <div className="max-w-[1140px] mx-auto px-6">
        <div className="text-center mb-16">
          <p className="uppercase text-blue-600 text-xs font-bold tracking-widest mb-4">PLATFORM FEATURES</p>
          <h2 className="text-5xl font-bold tracking-tighter text-gray-950">Everything your team needs</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-md mx-auto">One powerful platform for customer support and team collaboration.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                <f.icon size={26} className={f.color} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{f.title}</h3>
              <p className="text-gray-600 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Services / Pricing Section ─────────────────────────────────── */
export function ServicesList() {
  const [services, setServices] = useState([]);
  const { user } = useAuthStore();

  useEffect(() => {
    api.get('/services').then(res => setServices(Array.isArray(res.data) ? res.data : res.data.data ?? []))
  }, []);

  const handleBuy = async (serviceId) => {
    if (!user) return alert('Please login first');
    try {
      await api.post('/orders', { serviceId });
      alert('Order placed successfully!');
    } catch {
      alert('Failed to place order');
    }
  };

  return (
    <>
      <FeatureSection />

      <section className="py-24 bg-white">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="uppercase text-blue-600 text-xs font-bold tracking-widest mb-4">PRICING PLANS</p>
            <h2 className="text-5xl font-bold tracking-tighter text-gray-950">Simple, transparent pricing</h2>
            <p className="mt-4 text-lg text-gray-600">No hidden fees. No surprises.</p>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-20 text-gray-500">Loading pricing plans...</div>
          ) : (
            <div className={`grid gap-8 mx-auto ${services.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} max-w-6xl`}>
              {services.map((service, idx) => {
                const isPopular = idx === 1 && services.length >= 3;

                return (
                  <div
                    key={service._id}
                    className={`relative rounded-3xl overflow-hidden border flex flex-col transition-all ${
                      isPopular 
                        ? 'border-blue-600 shadow-2xl scale-105 bg-gray-950' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute top-6 right-6 bg-blue-600 text-white text-xs font-bold px-5 py-1.5 rounded-full">
                        MOST POPULAR
                      </div>
                    )}

                    <div className={`h-52 flex items-center justify-center ${isPopular ? 'bg-white/10' : 'bg-gray-50'}`}>
                      {service.image ? (
                        <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
                      ) : (
                        <Layers size={60} className={isPopular ? 'text-white/30' : 'text-gray-300'} />
                      )}
                    </div>

                    <div className="p-8 flex-1 flex flex-col">
                      <h3 className={`text-2xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                        {service.title}
                      </h3>
                      <p className={`mb-8 ${isPopular ? 'text-gray-400' : 'text-gray-500'}`}>
                        {service.description}
                      </p>

                      <div className="space-y-4 flex-1 mb-10">
                        {['Everything included', 'Priority support', 'Dedicated manager'].map((item) => (
                          <div key={item} className={`flex items-center gap-3 ${isPopular ? 'text-gray-300' : 'text-gray-600'}`}>
                            <CheckCircle2 size={20} className={isPopular ? 'text-emerald-400' : 'text-emerald-600'} />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-gray-200 flex items-end justify-between">
                        <div>
                          <span className={`text-4xl font-bold ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                            ${service.price}
                          </span>
                          <span className={`ml-1 ${isPopular ? 'text-gray-400' : 'text-gray-500'}`}>/mo</span>
                        </div>

                        <button
                          onClick={() => handleBuy(service._id)}
                          className={`px-7 py-3 rounded-2xl font-semibold flex items-center gap-2 transition ${
                            isPopular 
                              ? 'bg-white text-gray-900 hover:bg-gray-100' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <ShoppingCart size={17} /> Get started
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gray-950 py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-white tracking-tighter mb-6">Ready to transform your support?</h2>
          <p className="text-gray-400 text-lg mb-10">Join thousands of teams who trust SupportFlow.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl flex items-center gap-3">
              Start free trial <ArrowRight size={18} />
            </button>
            <button className="px-8 py-4 border border-gray-700 text-gray-300 hover:bg-white/5 rounded-2xl font-medium">Talk to sales</button>
          </div>
        </div>
      </section>
    </>
  );
}