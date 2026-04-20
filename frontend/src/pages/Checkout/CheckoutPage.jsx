'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, ShoppingCart, CheckCircle2, Layers,
  CreditCard, Shield, Lock, Zap, Clock, Package,
  ChevronRight, Loader2
} from 'lucide-react';
import api from '../api/axios';

import { useAuthStore } from '../../store/authStore';

export function CheckoutPage({ service, onBack, onSuccess }) {
  const { user } = useAuthStore();
  const [step, setStep] = useState('review');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

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

  const formatCard = (val) => {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    return clean.length >= 3 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 font-sans py-8 px-6">
      <div className="max-w-[960px] mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          {step !== 'success' && (
            <button
              onClick={onBack}
              className="w-10 h-10 bg-white border border-gray-200 hover:border-gray-300 rounded-2xl flex items-center justify-center backdrop-blur-md transition"
            >
              <ArrowLeft size={18} className="text-gray-500" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Layers size={18} color="#fff" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">SupportFlow</span>
          </div>

          {step !== 'success' && (
            <div className="ml-auto flex items-center gap-8 text-sm">
              {['review', 'payment'].map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s || (step === 'payment' && s === 'review')
                      ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step === 'payment' && s === 'review' ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <span className={`font-medium capitalize ${
                    step === s ? 'text-indigo-700' : 'text-gray-400'
                  }`}>
                    {s}
                  </span>
                  {i === 0 && <ChevronRight size={16} className="text-gray-300" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">

          {/* STEP 1: REVIEW */}
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-8"
            >
              {/* Service Details */}
              <div className="lg:col-span-3">
                <div className="bg-white/90 backdrop-blur-xl border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                  {service.image ? (
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className="w-full h-56 object-cover"
                    />
                  ) : (
                    <div className="w-full h-56 bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
                      <Package size={64} className="text-gray-300" />
                    </div>
                  )}

                  <div className="p-8">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
                      {service.title}
                    </h2>
                    <p className="text-gray-600 leading-relaxed mb-8">
                      {service.description}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      {[
                        { icon: Zap, label: 'Instant Activation' },
                        { icon: Shield, label: 'Enterprise SLA' },
                        { icon: Clock, label: '24/7 Support' },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium px-4 py-2 rounded-2xl">
                          <Icon size={14} /> {label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/90 backdrop-blur-xl border border-gray-100 rounded-3xl p-8 shadow-sm">
                  <h3 className="font-semibold text-lg mb-6 text-gray-900">Order Summary</h3>
                  
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{service.title}</span>
                      <span className="font-semibold text-gray-900">${service.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Setup fee</span>
                      <span className="font-semibold text-emerald-600">Free</span>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 my-6" />

                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>${service.price}</span>
                  </div>

                  <button
                    onClick={() => setStep('payment')}
                    className="mt-8 w-full h-14 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-2xl flex items-center justify-center gap-3 hover:shadow-xl transition"
                  >
                    Continue to Payment <ChevronRight size={18} />
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-3xl p-6 space-y-4 text-sm">
                  {[
                    { icon: Lock, label: 'SSL Encrypted Checkout' },
                    { icon: Shield, label: '30-day money back guarantee' },
                    { icon: CheckCircle2, label: 'Instant confirmation email' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 text-gray-600">
                      <Icon size={18} className="text-emerald-600" /> 
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: PAYMENT */}
          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-8"
            >
              {/* Payment Form */}
              <div className="lg:col-span-3 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-3xl p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                    <CreditCard size={22} color="#fff" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">Payment Details</h3>
                    <p className="text-xs text-gray-500">Your information is encrypted and secure</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Card Number</label>
                    <div className="relative">
                      <input
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: formatCard(e.target.value) })}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        className="w-full h-14 pl-5 pr-12 bg-gray-50 border border-gray-200 rounded-2xl text-lg tracking-widest focus:outline-none focus:border-indigo-400"
                      />
                      <CreditCard size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Cardholder Name</label>
                    <input
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                      placeholder={user?.name || "John Doe"}
                      className="w-full h-14 px-5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Expiry Date</label>
                      <input
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full h-14 px-5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">CVV</label>
                      <input
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        placeholder="•••"
                        type="password"
                        maxLength={4}
                        className="w-full h-14 px-5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className={`mt-4 w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition shadow-lg ${
                      loading 
                        ? 'bg-indigo-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-xl text-white'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Lock size={18} /> Pay ${service.price} Securely
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/90 backdrop-blur-xl border border-gray-100 rounded-3xl p-8">
                  <div className="flex gap-5 mb-6">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {service.image ? (
                        <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={32} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-gray-900">{service.title}</p>
                      <p className="text-xs text-gray-500 mt-1">One-time payment • Instant access</p>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 my-6" />

                  <div className="flex justify-between text-2xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>${service.price}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-3xl p-6 text-sm">
                  {[
                    { icon: Lock, label: '256-bit SSL encryption' },
                    { icon: Shield, label: 'PCI DSS compliant' },
                    { icon: CheckCircle2, label: 'No hidden charges' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 mb-4 last:mb-0 text-gray-600">
                      <Icon size={18} className="text-indigo-600" /> 
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center min-h-[70vh]"
            >
              <div className="bg-white/95 backdrop-blur-2xl border border-gray-100 rounded-3xl p-16 max-w-lg text-center shadow-xl">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="w-24 h-24 mx-auto mb-8 rounded-full border-4 border-emerald-200 bg-emerald-50 flex items-center justify-center"
                >
                  <CheckCircle2 size={52} className="text-emerald-600" />
                </motion.div>

                <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">Order Confirmed!</h2>
                <p className="text-gray-600 mb-8">
                  Your order for <span className="font-semibold text-gray-900">{service.title}</span> has been placed successfully.
                </p>

                {orderId && (
                  <p className="text-xs text-gray-500 mb-10">
                    Order ID: <span className="font-mono bg-gray-100 px-3 py-1 rounded-lg">{orderId}</span>
                  </p>
                )}

                <div className="flex flex-wrap justify-center gap-3 mb-10">
                  {[
                    { icon: Clock, label: 'Team notified' },
                    { icon: Zap, label: 'Setup begins soon' },
                    { icon: CheckCircle2, label: 'Confirmation sent' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium px-5 py-2 rounded-2xl">
                      <Icon size={14} /> {label}
                    </div>
                  ))}
                </div>

                <button
                  onClick={onSuccess}
                  className="w-full h-14 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-2xl hover:shadow-xl transition"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}