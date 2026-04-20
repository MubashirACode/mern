'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Package, Clock, CheckCircle2, TrendingUp,
  Layers, ArrowRight, Activity,
  LayoutDashboard, Store, LogOut, CreditCard,
  Shield, Zap, Lock, ChevronRight, Loader2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';


import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';

const statusConfig = {
  completed: {
    color: '#16a34a', bg: 'rgba(34,197,94,0.1)',
    icon: <CheckCircle2 size={14} color="#16a34a" />, label: 'Completed',
  },
  in_progress: {
    color: '#6366f1', bg: 'rgba(99,102,241,0.1)',
    icon: <Activity size={14} color="#6366f1" />, label: 'In Progress',
  },
  pending: {
    color: '#d97706', bg: 'rgba(245,158,11,0.1)',
    icon: <Clock size={14} color="#d97706" />, label: 'Pending',
  },
};

/* ── Checkout Modal ─────────────────────────────────────────────── */
function CheckoutModal({ service, onClose, onSuccess }) {
  const { user } = useAuthStore();
  const [step, setStep]     = useState('review');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });

  const formatCard   = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v) => {
    const c = v.replace(/\D/g, '').slice(0, 4);
    return c.length >= 3 ? `${c.slice(0, 2)}/${c.slice(2)}` : c;
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/orders', { serviceId: service._id });
      setOrderId(data._id);
      setStep('success');
    } catch (err) {
      alert(err.response?.data?.message || 'Error placing order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={step !== 'success' ? onClose : undefined}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-3xl shadow-2xl overflow-hidden w-full ${step === 'success' ? 'max-w-md' : 'max-w-3xl'}`}
      >
        {/* Modal Header with steps */}
        {step !== 'success' && (
          <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-6 text-sm">
              {['review', 'payment'].map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s || (step === 'payment' && s === 'review')
                      ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step === 'payment' && s === 'review' ? <CheckCircle2 size={13} /> : i + 1}
                  </div>
                  <span className={`font-medium capitalize ${step === s ? 'text-indigo-700' : 'text-gray-400'}`}>
                    {s === 'review' ? 'Review' : 'Payment'}
                  </span>
                  {i === 0 && <ChevronRight size={14} className="text-gray-300 ml-2" />}
                </div>
              ))}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
              <X size={20} />
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: REVIEW */}
          {step === 'review' && (
            <motion.div key="review" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              className="grid grid-cols-1 md:grid-cols-2"
            >
              <div className="p-8 border-r border-gray-100">
                <div className="h-52 bg-gray-100 rounded-2xl overflow-hidden mb-6">
                  {service.image
                    ? <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
                    : <div className="h-full flex items-center justify-center"><Package size={48} className="text-gray-300" /></div>
                  }
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{service.description}</p>
                <div className="flex flex-wrap gap-2">
                  {[{ icon: Zap, label: 'Instant Activation' }, { icon: Shield, label: 'Enterprise SLA' }, { icon: Clock, label: '24/7 Support' }].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-2xl">
                      <Icon size={12} /> {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 flex flex-col">
                <h3 className="font-semibold text-lg mb-6">Order Summary</h3>
                <div className="space-y-4 text-sm flex-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{service.title}</span>
                    <span className="font-semibold">${service.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Setup fee</span>
                    <span className="text-emerald-600 font-semibold">Free</span>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex justify-between text-xl font-bold text-gray-900 mb-6">
                    <span>Total</span><span>${service.price}</span>
                  </div>
                  <button
                    onClick={() => setStep('payment')}
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 hover:shadow-lg transition"
                  >
                    Continue <ChevronRight size={17} />
                  </button>
                  <div className="mt-5 space-y-3">
                    {[{ icon: Lock, label: 'SSL Encrypted' }, { icon: Shield, label: '30-day guarantee' }, { icon: CheckCircle2, label: 'Instant confirmation' }].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-2 text-xs text-gray-500">
                        <Icon size={13} className="text-emerald-500" /> {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: PAYMENT */}
          {step === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
              className="grid grid-cols-1 md:grid-cols-2"
            >
              <div className="p-8 border-r border-gray-100">
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                    <CreditCard size={20} color="#fff" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Payment Details</p>
                    <p className="text-xs text-gray-500">Your info is encrypted & secure</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-2">Card Number</label>
                    <input
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: formatCard(e.target.value) })}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-2xl text-base tracking-widest focus:outline-none focus:border-indigo-400 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-2">Cardholder Name</label>
                    <input
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                      placeholder={user?.name || 'John Doe'}
                      className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400 transition"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-2">Expiry</label>
                      <input
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                        placeholder="MM/YY" maxLength={5}
                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-2">CVV</label>
                      <input
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        placeholder="•••" type="password" maxLength={4}
                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400 transition"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className={`mt-2 w-full h-13 py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-3 transition ${
                      loading ? 'bg-indigo-400 cursor-not-allowed text-white' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-xl'
                    }`}
                  >
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Processing…</> : <><Lock size={16} /> Pay ${service.price} Securely</>}
                  </button>
                </div>
              </div>

              <div className="p-8 bg-gray-50 flex flex-col gap-5">
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  <div className="flex gap-4 mb-5">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                      {service.image ? <img src={service.image} alt="" className="w-full h-full object-cover" /> : <Package size={24} className="text-gray-300" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{service.title}</p>
                      <p className="text-xs text-gray-500 mt-1">One-time payment</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-4 border-t border-gray-100">
                    <span>Total</span><span>${service.price}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {[{ icon: Lock, label: '256-bit SSL' }, { icon: Shield, label: 'PCI DSS compliant' }, { icon: CheckCircle2, label: 'No hidden charges' }].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-gray-500">
                      <Icon size={13} className="text-indigo-500" /> {label}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="p-14 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.1 }}
                className="w-20 h-20 mx-auto rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mb-7"
              >
                <CheckCircle2 size={44} className="text-emerald-600" />
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Order Confirmed!</h2>
              <p className="text-gray-600 mb-3">Your order for <strong className="text-gray-900">{service.title}</strong> has been placed.</p>
              {orderId && <p className="text-xs text-gray-500 mb-8">Order ID: <code className="font-mono bg-gray-100 px-3 py-1 rounded-lg text-indigo-600">{orderId}</code></p>}
              <button onClick={onSuccess} className="w-full h-13 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-2xl hover:shadow-xl transition">
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ── UserDashboard ──────────────────────────────────────────────── */
export function UserDashboard() {
  const { user, logout } = useAuthStore();
  const [orders, setOrders]       = useState([]);
  const [services, setServices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [checkoutService, setCheckoutService] = useState(null);
  const [toast, setToast]         = useState(null);
  const pollingRef = useRef(null);

  const refreshOrders = async () => {
    try {
      const { data } = await api.get('/orders/my');
      setOrders(Array.isArray(data) ? data : []);
    } catch { setOrders([]); }
  };

  useEffect(() => {
    Promise.all([api.get('/orders/my'), api.get('/services')])
      .then(([o, s]) => {
        setOrders(Array.isArray(o.data) ? o.data : []);
        setServices(Array.isArray(s.data) ? s.data : []);
      })
      .catch(() => { setOrders([]); setServices([]); })
      .finally(() => setLoading(false));

    pollingRef.current = setInterval(refreshOrders, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const activeOrder = orders[0];
  const statusProgress = { pending: 20, in_progress: 65, completed: 100 };
  const progress = statusProgress[activeOrder?.status] ?? 0;

  const phases = [
    { phase: 'Phase 01', label: 'Discovery',   done: ['in_progress', 'completed'].includes(activeOrder?.status), active: activeOrder?.status === 'pending'     },
    { phase: 'Phase 02', label: 'In Progress', done: activeOrder?.status === 'completed',                         active: activeOrder?.status === 'in_progress' },
    { phase: 'Phase 03', label: 'Deployed',    done: activeOrder?.status === 'completed',                         active: false                                  },
  ];

  const alreadyOrdered = (serviceId) =>
    orders.some((o) => o.serviceId?._id === serviceId || o.serviceId === serviceId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 font-sans flex">

      {/* Checkout Modal */}
      <AnimatePresence>
        {checkoutService && (
          <CheckoutModal
            service={checkoutService}
            onClose={() => setCheckoutService(null)}
            onSuccess={async () => {
              setCheckoutService(null);
              await refreshOrders();
              setActiveTab('dashboard');
              showToast('Order placed successfully!', 'success');
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-[200px] border-r border-gray-200 bg-white/75 backdrop-blur-xl flex flex-col p-6 flex-shrink-0 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <Layers size={18} color="#fff" />
          </div>
          <span className="font-bold text-gray-900 tracking-tight">SupportFlow</span>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'services',  icon: Store,           label: 'Services'  },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-indigo-100 text-indigo-700 border-l-2 border-indigo-600'
                  : 'text-gray-600 hover:bg-gray-100 border-l-2 border-transparent'
              }`}
            >
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-gray-200">
          <div className="px-3 mb-5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold mb-2">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
            <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-3 py-0.5 rounded-full inline-block mt-1">
              Enterprise
            </span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-2xl text-sm font-medium transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-9">

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-5 right-6 z-50 px-6 py-3.5 rounded-2xl shadow-xl text-sm font-semibold ${
                toast.type === 'success'
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <header className="mb-10">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Dashboard</h1>
              <p className="text-gray-500 mt-1">Welcome back, {user?.name?.split(' ')[0]} 👋</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left */}
              <div className="lg:col-span-8 space-y-6">

                {/* Active Service */}
                <div className="bg-white/90 backdrop-blur-xl border border-gray-100 rounded-3xl p-8 shadow-sm">
                  <p className="uppercase text-[10px] font-bold tracking-widest text-gray-500 mb-2">Active Service</p>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      {activeOrder ? activeOrder.serviceId?.title : 'No Active Service'}
                    </h2>
                    {activeOrder && (
                      <span
                        className="text-xs font-semibold px-4 py-1 rounded-full"
                        style={{ background: (statusConfig[activeOrder.status] || statusConfig.pending).bg, color: (statusConfig[activeOrder.status] || statusConfig.pending).color }}
                      >
                        {(statusConfig[activeOrder.status] || statusConfig.pending).label}
                      </span>
                    )}
                  </div>

                  {activeOrder ? (
                    <>
                      <div className="mb-8">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-gray-500">Project Progress</span>
                          <span className="font-semibold text-indigo-600">{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            key={activeOrder.status}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {phases.map((p, i) => (
                          <div
                            key={i}
                            className={`p-4 rounded-2xl border transition-all ${
                              p.done   ? 'border-emerald-200 bg-emerald-50'
                            : p.active ? 'border-indigo-200 bg-indigo-50'
                            :            'border-gray-100 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {p.done   ? <CheckCircle2 size={13} className="text-emerald-600" />
                             : p.active ? <Activity     size={13} className="text-indigo-600"  />
                             :            <Clock        size={13} className="text-gray-400"    />}
                              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{p.phase}</span>
                            </div>
                            <p className={`font-semibold text-sm ${p.done || p.active ? 'text-gray-900' : 'text-gray-400'}`}>
                              {p.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10">
                      <Package size={44} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-sm">No active services yet</p>
                      <button
                        onClick={() => setActiveTab('services')}
                        className="mt-5 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-2xl inline-flex items-center gap-2 hover:shadow-lg transition"
                      >
                        <Store size={15} /> Browse Services
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: `Total Orders: ${orders.length}`, color: '#6366f1' },
                    { label: 'Priority Support: Active',       color: '#22c55e' },
                    { label: 'Cloud Uptime: 99.9%',            color: '#22c55e' },
                    { label: 'SLA Tier: Platinum',             color: '#f59e0b' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl p-5 flex items-center gap-4">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Order History */}
              <div className="lg:col-span-4">
                <div className="bg-white/90 backdrop-blur-xl border border-gray-100 rounded-3xl overflow-hidden shadow-sm h-full flex flex-col">
                  <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                    <p className="font-semibold text-gray-900 text-sm">Order History</p>
                    <span className="text-xs text-gray-400">{orders.length} total</span>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {orders.length === 0 ? (
                      <div className="py-10 text-center text-gray-400 text-sm">No orders yet</div>
                    ) : orders.map((order) => {
                      const st = statusConfig[order.status] || statusConfig.pending;
                      return (
                        <div key={order._id} className="px-6 py-4 border-b border-gray-100 last:border-none flex justify-between items-center">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="font-medium text-gray-900 text-sm truncate">{order.serviceId?.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">${order.serviceId?.price}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold flex-shrink-0" style={{ color: st.color }}>
                            {st.icon} {st.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SERVICES TAB ── */}
        {activeTab === 'services' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <header className="mb-10">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Browse Services</h1>
              <p className="text-gray-500 mt-1">Choose a service to get started</p>
            </header>

            {loading ? (
              <div className="text-center py-20 text-gray-500">Loading services…</div>
            ) : services.length === 0 ? (
              <div className="text-center py-20 text-gray-500">No services available yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service, idx) => {
                  const purchased = alreadyOrdered(service._id);
                  return (
                    <motion.div
                      key={service._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -4 }}
                      className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm flex flex-col"
                    >
                      <div className="h-48 bg-gray-100 relative overflow-hidden">
                        {service.image
                          ? <img src={service.image} alt={service.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          : <div className="absolute inset-0 flex items-center justify-center"><Layers size={44} className="text-gray-300" /></div>
                        }
                        {purchased && (
                          <div className="absolute top-3 right-3 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={11} /> Purchased
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">{service.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-3 flex-1 leading-relaxed">{service.description}</p>
                        <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-2xl font-bold text-gray-900">${service.price}</span>
                          <button
                            onClick={() => !purchased && setCheckoutService(service)}
                            disabled={purchased}
                            className={`px-5 py-2.5 text-sm font-semibold rounded-2xl transition ${
                              purchased
                                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg'
                            }`}
                          >
                            {purchased ? 'Ordered' : 'Checkout'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}