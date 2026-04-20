'use client';

import React, { useState, useEffect } from 'react';
import { Navbar, Hero, ServicesList } from './components/Landing';
import { ChatWidget } from './components/chat/ChatWidget';
import { useAuthStore } from './store/authStore';
import { Loader2 } from 'lucide-react';
import { UserDashboard } from './pages/User/UserDashboard';
import { AdminDashboard } from './pages/Admin/AdminDashboard';


// Simple hash-based router
const getRoute = () => window.location.hash.replace('#', '') || '/';

export default function App() {
  const { user, checkAuth, loading } = useAuthStore();
  const [route, setRoute] = useState(getRoute());
  const [checkoutService, setCheckoutService] = useState(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // After login — redirect to correct dashboard based on role
  useEffect(() => {
    if (!user) return;

    if (user.role === 'admin' && route !== '/admin') {
      window.location.hash = '#/admin';
    } else if (user.role === 'user' && route !== '/dashboard' && route !== '/checkout') {
      window.location.hash = '#/dashboard';
    }
  }, [user, route]);

  const navigate = (path) => {
    window.location.hash = `#${path}`;
    setRoute(path);
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600" size={36} />
          <p className="mt-4 text-sm text-gray-500 font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  // No user → Show Public Landing Page
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <Hero />
        <ServicesList 
          onCheckout={(service) => {
            setCheckoutService(service);
            navigate('/checkout');
          }} 
        />
        <ChatWidget />
      </div>
    );
  }

  // Admin Dashboard
  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  // User Checkout Page
  if (route === '/checkout' && checkoutService) {
    return (
      <CheckoutPage
        service={checkoutService}
        onBack={() => navigate('/dashboard')}
        onSuccess={() => {
          setCheckoutService(null);
          navigate('/dashboard');
        }}
      />
    );
  }

  // User Dashboard (Default)
  return (
    <>
      <UserDashboard 
        onCheckout={(service) => {
          setCheckoutService(service);
          navigate('/checkout');
        }} 
      />
      <ChatWidget />
    </>
  );
}