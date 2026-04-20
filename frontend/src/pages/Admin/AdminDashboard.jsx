import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users, Package, MessageSquare, Plus, Trash2, Edit2,
  LayoutDashboard, ArrowRight, Layers, LogOut,
  CheckCircle2, Clock, ShoppingBag,
  RefreshCw, Send, X, ChevronLeft, Bell, Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import api from '../../api/axios';

/* ─── constants ───────────────────────────────────────────────── */
const glass = {
  background: 'rgba(255,255,255,0.82)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(220,220,240,0.65)',
  borderRadius: 16,
};

const statusColors = {
  completed:   { bg: 'rgba(34,197,94,0.1)',  color: '#16a34a', dot: '#22c55e' },
  in_progress: { bg: 'rgba(99,102,241,0.1)', color: '#6366f1', dot: '#6366f1' },
  pending:     { bg: 'rgba(245,158,11,0.1)', color: '#d97706', dot: '#f59e0b' },
};

const statusLabel = {
  completed: 'Completed',
  in_progress: 'In Progress',
  pending: 'Pending',
};

const inputStyle = {
  width: '100%',
  height: 42,
  borderRadius: 10,
  border: '1px solid rgba(220,220,240,0.8)',
  background: 'rgba(248,248,252,0.8)',
  padding: '0 14px',
  fontSize: 13,
  color: '#0f0f1a',
  outline: 'none',
  boxSizing: 'border-box',
};

/* ─── component ───────────────────────────────────────────────── */
export function AdminDashboard() {
  const { logout, user: adminUser } = useAuthStore();

  const {
    messages,
    sendMessage,
    fetchMessages,
    initSocket,
    adminUnreadMap,
    clearAdminUnread,
    markAsSeen,
    setOpenChatUserId,
  } = useChatStore();

  const [activeTab, setActiveTab]           = useState('overview');
  const [users, setUsers]                   = useState([]);
  const [orders, setOrders]                 = useState([]);
  const [services, setServices]             = useState([]);
  const [selectedUser, setSelectedUser]     = useState(null);
  const [reply, setReply]                   = useState('');
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newService, setNewService]         = useState({ title: '', description: '', price: '', image: '' });
  const [toast, setToast]                   = useState(null);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const scrollRef         = useRef(null);
  const prevOrderCountRef = useRef(0);
  const pollingRef        = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Data fetch ─────────────────────────────────────────────── */
  const fetchData = useCallback(async (silent = false) => {
    try {
      const [u, o, s] = await Promise.all([
        api.get('/users'),
        api.get('/orders'),
        api.get('/services'),
      ]);
      const newOrders = o.data;

      if (prevOrderCountRef.current > 0 && newOrders.length > prevOrderCountRef.current) {
        const diff = newOrders.length - prevOrderCountRef.current;
        setNewOrdersCount(diff);
        showToast(`🛒 ${diff} new order${diff > 1 ? 's' : ''} received!`, 'info');
        setTimeout(() => setNewOrdersCount(0), 5000);
      }
      prevOrderCountRef.current = newOrders.length;

      setUsers(u.data);
      setOrders(newOrders);
      setServices(s.data);
    } catch (err) {
      if (!silent) console.error(err);
    }
  }, []);

  useEffect(() => {
    initSocket(adminUser?._id, 'admin');
    fetchData();
    pollingRef.current = setInterval(() => fetchData(true), 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchData]);

  /* ── Scroll to bottom ───────────────────────────────────────── */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  /* ── Open chat ──────────────────────────────────────────────── */
  const openChat = (u) => {
    setSelectedUser(u);
    fetchMessages(u._id);
    setOpenChatUserId(u._id);   // Bug 1 fix
    clearAdminUnread(u._id);
    markAsSeen(u._id);
  };

  /* ── Close chat ─────────────────────────────────────────────── */
  const closeChat = () => {
    setSelectedUser(null);
    setOpenChatUserId(null);    // Bug 1 fix
  };

  /* ── Total unread ───────────────────────────────────────────── */
  const totalUnread = Object.values(adminUnreadMap).reduce((s, n) => s + n, 0);

  /* ── Send reply ─────────────────────────────────────────────── */
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!reply.trim() || !selectedUser) return;
    sendMessage(selectedUser._id, 'admin', reply);
    setReply('');
  };

  /* ── Add service ────────────────────────────────────────────── */
  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/services', newService);
      setServices(prev => [...prev, data]);
      setIsAddServiceOpen(false);
      setNewService({ title: '', description: '', price: '', image: '' });
      showToast('Service added successfully!');
    } catch {
      showToast('Failed to add service', 'error');
    }
  };

  /* ── Delete service ─────────────────────────────────────────── */
  const handleDeleteService = async (id) => {
    if (!confirm('Delete this service?')) return;
    try {
      await api.delete(`/services/${id}`);
      setServices(prev => prev.filter(s => s._id !== id));
      showToast('Service deleted');
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  /* ── Update order status ────────────────────────────────────── */
  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}`, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      showToast(`Order marked as ${statusLabel[status]}`);
    } catch {
      showToast('Error updating status', 'error');
    }
  };

  const navItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview'                      },
    { id: 'users',    icon: Users,           label: 'Users'                         },
    { id: 'chats',    icon: MessageSquare,   label: 'Chats',   badge: totalUnread   },
    { id: 'services', icon: Layers,          label: 'Services'                      },
    { id: 'orders',   icon: Package,         label: 'Orders',  badge: newOrdersCount },
  ];

  const stats = [
    { label: 'Total Users',  value: users.length,    icon: Users,         color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Total Orders', value: orders.length,   icon: ShoppingBag,   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Services',     value: services.length, icon: Layers,        color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Active Chats', value: users.length,    icon: MessageSquare, color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
  ];

  const chatMessages = messages.filter(
    m => m.userId === selectedUser?._id || m.userId?._id === selectedUser?._id
  );

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: 'linear-gradient(145deg, #f5f5fb 0%, #eeeeff 50%, #f5f5fb 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>

      {/* ════ Sidebar ════ */}
      <aside style={{
        width: 220, borderRight: '1px solid rgba(220,220,240,0.6)',
        background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column', padding: '24px 16px',
        gap: 4, flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 16 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Layers size={15} color="#fff" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f0f1a' }}>SupportFlow</p>
            <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>Admin Console</p>
          </div>
        </div>

        {/* Live indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
          borderRadius: 10, background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)', marginBottom: 14,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
            display: 'block', flexShrink: 0, animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>Live Sync Active</span>
          <Wifi size={11} color="#22c55e" style={{ marginLeft: 'auto' }} />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(({ id, icon: Icon, label, badge }) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: activeTab === id
                ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))'
                : 'transparent',
              color: activeTab === id ? '#6366f1' : '#6b7280',
              fontSize: 13, fontWeight: activeTab === id ? 600 : 500,
              textAlign: 'left', transition: 'all 0.15s',
              borderLeft: activeTab === id ? '2px solid #6366f1' : '2px solid transparent',
            }}>
              <Icon size={16} />
              {label}
              {!!badge && (
                <motion.span
                  key={badge}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    marginLeft: 'auto', minWidth: 19, height: 19, borderRadius: 10,
                    background: id === 'chats' ? '#6366f1' : '#ef4444',
                    color: '#fff', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 5px',
                    boxShadow: id === 'chats'
                      ? '0 2px 8px rgba(99,102,241,0.4)'
                      : '0 2px 8px rgba(239,68,68,0.4)',
                  }}
                >
                  {badge > 9 ? '9+' : badge}
                </motion.span>
              )}
            </button>
          ))}
        </nav>

        {/* User info + logout */}
        <div style={{ borderTop: '1px solid rgba(220,220,240,0.6)', paddingTop: 16 }}>
          <div style={{ padding: '0 12px', marginBottom: 12 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', marginBottom: 6,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
            }}>
              {adminUser?.name?.charAt(0)?.toUpperCase()}
            </div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f0f1a' }}>{adminUser?.name}</p>
            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Administrator</p>
          </div>
          <button onClick={logout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#ef4444', fontSize: 13, fontWeight: 500,
          }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* ════ Main ════ */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto', padding: '32px 32px 24px' }}>

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -16, x: 20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: -16 }}
                style={{
                  position: 'fixed', top: 20, right: 24, zIndex: 200,
                  background: toast.type === 'success' ? 'rgba(220,252,231,0.97)'
                    : toast.type === 'error' ? 'rgba(254,226,226,0.97)'
                    : 'rgba(224,231,255,0.97)',
                  border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)'
                    : toast.type === 'error' ? 'rgba(239,68,68,0.3)'
                    : 'rgba(99,102,241,0.3)'}`,
                  color: toast.type === 'success' ? '#16a34a'
                    : toast.type === 'error' ? '#dc2626' : '#6366f1',
                  padding: '12px 20px', borderRadius: 14, fontSize: 13, fontWeight: 600,
                  backdropFilter: 'blur(12px)', boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', gap: 8, maxWidth: 320,
                }}
              >
                {toast.type === 'info' && <Bell size={14} />}
                {toast.message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <header style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0f0f1a', letterSpacing: '-0.03em' }}>
                  {navItems.find(n => n.id === activeTab)?.label}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button onClick={() => fetchData()} style={{
                height: 36, padding: '0 14px', borderRadius: 10,
                border: '1px solid rgba(220,220,240,0.8)', background: 'rgba(255,255,255,0.8)',
                color: '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </header>

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (() => {
            // ✅ Frontend pe bhi sort karo — backend sort ke alawa safety net
            const latestOrders = [...orders].sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            ).slice(0, 6);

            const pendingCount   = orders.filter(o => o.status === 'pending').length;
            const completedCount = orders.filter(o => o.status === 'completed').length;
            const inProgressCount = orders.filter(o => o.status === 'in_progress').length;

            const extendedStats = [
              { label: 'Total Users',  value: users.length,     icon: Users,         color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  sub: `${users.length} registered` },
              { label: 'Total Orders', value: orders.length,    icon: ShoppingBag,   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  sub: `${pendingCount} pending` },
              { label: 'Services',     value: services.length,  icon: Layers,        color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  sub: `Active catalog` },
              { label: 'Completed',    value: completedCount,   icon: CheckCircle2,  color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   sub: `${inProgressCount} in progress` },
            ];

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                  {extendedStats.map((s, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      style={{ ...glass, padding: '20px', boxShadow: '0 2px 12px rgba(80,80,120,0.06)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <s.icon size={18} color={s.color} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                      </div>
                      <p style={{ margin: '0 0 4px', fontSize: 32, fontWeight: 800, color: '#0f0f1a', letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{s.sub}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Bottom grid: recent orders + order status breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>

                  {/* ── Recent Orders table ── */}
                  <div style={{ ...glass, padding: 0, overflow: 'hidden', boxShadow: '0 2px 12px rgba(80,80,120,0.06)' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(220,220,240,0.55)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f0f1a' }}>Latest Orders</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>Most recent {latestOrders.length} orders</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'block', animation: 'pulse 2s infinite' }} />
                        <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>Live</span>
                        <button
                          onClick={() => setActiveTab('orders')}
                          style={{
                            marginLeft: 8, height: 26, padding: '0 10px', borderRadius: 7,
                            border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.06)',
                            color: '#6366f1', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          View All
                        </button>
                      </div>
                    </div>

                    {latestOrders.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#c4c4d4', fontSize: 13 }}>
                        <ShoppingBag size={32} color="#e0e0ef" style={{ marginBottom: 8 }} />
                        <p style={{ margin: 0 }}>No orders yet</p>
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(245,245,252,0.6)' }}>
                            {['User', 'Service', 'Price', 'Status', 'Date'].map(h => (
                              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {latestOrders.map((o, i) => {
                            const sc = statusColors[o.status] || statusColors.pending;
                            const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
                            return (
                              <motion.tr
                                key={o._id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                style={{ borderTop: '1px solid rgba(220,220,240,0.4)' }}
                              >
                                {/* User with avatar */}
                                <td style={{ padding: '12px 16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 10, fontWeight: 700, color: '#fff',
                                    }}>
                                      {o.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0f0f1a' }}>
                                      {o.userId?.name || 'Unknown'}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', maxWidth: 140 }}>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                    {o.serviceId?.title || 'Unknown service'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#0f0f1a' }}>
                                  ${o.serviceId?.price ?? '—'}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                                    background: sc.bg, color: sc.color,
                                  }}>
                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot, display: 'block' }} />
                                    {statusLabel[o.status] || o.status}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: 11, color: '#9ca3af' }}>{date}</td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* ── Order status breakdown card ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Status breakdown */}
                    <div style={{ ...glass, padding: 20, boxShadow: '0 2px 12px rgba(80,80,120,0.06)', flex: 1 }}>
                      <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#0f0f1a' }}>Order Status</p>
                      {[
                        { label: 'Pending',     count: pendingCount,    ...statusColors.pending,    icon: Clock       },
                        { label: 'In Progress', count: inProgressCount, ...statusColors.in_progress, icon: RefreshCw   },
                        { label: 'Completed',   count: completedCount,  ...statusColors.completed,  icon: CheckCircle2 },
                      ].map(({ label, count, bg, color, dot, icon: Icon }) => (
                        <div key={label} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', borderRadius: 10, marginBottom: 8,
                          background: bg, border: `1px solid ${bg}`,
                        }}>
                          <Icon size={14} color={color} style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color, flex: 1 }}>{label}</span>
                          <span style={{
                            minWidth: 24, height: 24, borderRadius: 7,
                            background: 'rgba(255,255,255,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, color,
                          }}>
                            {count}
                          </span>
                        </div>
                      ))}

                      {/* Progress bar visual */}
                      {orders.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>Completion rate</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a' }}>
                              {Math.round((completedCount / orders.length) * 100)}%
                            </span>
                          </div>
                          <div style={{ height: 5, borderRadius: 99, background: 'rgba(220,220,240,0.6)', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(completedCount / orders.length) * 100}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #22c55e, #16a34a)' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick actions */}
                    <div style={{ ...glass, padding: 16, boxShadow: '0 2px 12px rgba(80,80,120,0.06)' }}>
                      <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#0f0f1a' }}>Quick Actions</p>
                      {[
                        { label: 'View All Orders',  tab: 'orders',   color: '#6366f1', bg: 'rgba(99,102,241,0.08)'  },
                        { label: 'Manage Services',  tab: 'services', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
                        { label: 'View All Chats',   tab: 'chats',    color: '#22c55e', bg: 'rgba(34,197,94,0.08)'  },
                      ].map(({ label, tab, color, bg }) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          style={{
                            width: '100%', padding: '9px 12px', borderRadius: 9, border: 'none',
                            background: bg, color, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            textAlign: 'left', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 7,
                            transition: 'opacity 0.15s',
                          }}
                        >
                          <ArrowRight size={12} /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── USERS ── */}
          {activeTab === 'users' && (
            <div style={{ ...glass, padding: 0, overflow: 'hidden', boxShadow: '0 2px 12px rgba(80,80,120,0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(245,245,252,0.6)' }}>
                    {['Name', 'Email', 'Joined', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} style={{ borderTop: '1px solid rgba(220,220,240,0.45)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, color: '#fff',
                          }}>
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f0f1a' }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: '#6b7280' }}>{u.email}</td>
                      <td style={{ padding: '16px 20px', fontSize: 12, color: '#9ca3af' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <button
                          onClick={() => { setActiveTab('chats'); openChat(u); }}
                          style={{
                            height: 30, padding: '0 14px', borderRadius: 8,
                            border: '1px solid rgba(99,102,241,0.3)',
                            background: 'rgba(99,102,241,0.06)', color: '#6366f1',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          Open Chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── SERVICES ── */}
          {activeTab === 'services' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setIsAddServiceOpen(true)} style={{
                  height: 38, padding: '0 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
                  fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
                }}>
                  <Plus size={15} /> Add Service
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
                {services.map(s => (
                  <motion.div key={s._id} whileHover={{ y: -3 }}
                    style={{ ...glass, overflow: 'hidden', boxShadow: '0 2px 12px rgba(80,80,120,0.06)' }}>
                    <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: 'rgba(245,245,252,0.8)' }}>
                      {s.image
                        ? <img src={s.image} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={24} color="#c4c4d4" /></div>
                      }
                    </div>
                    <div style={{ padding: 16 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#0f0f1a' }}>{s.title}</p>
                      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9ca3af' }}>{s.description?.slice(0, 60)}…</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: '#0f0f1a', letterSpacing: '-0.03em' }}>${s.price}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ height: 28, padding: '0 12px', borderRadius: 7, border: '1px solid rgba(220,220,240,0.8)', background: 'white', fontSize: 11, fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Edit2 size={11} /> Edit
                          </button>
                          <button onClick={() => handleDeleteService(s._id)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 size={12} color="#ef4444" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── ORDERS ── */}
          {activeTab === 'orders' && (
            <div style={{ ...glass, padding: 0, overflow: 'hidden', boxShadow: '0 2px 12px rgba(80,80,120,0.06)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(220,220,240,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f0f1a' }}>All Orders ({orders.length})</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'block' }} />
                  Auto-updating
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(245,245,252,0.6)' }}>
                    {['User', 'Service', 'Price', 'Status', 'Update'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id} style={{ borderTop: '1px solid rgba(220,220,240,0.45)' }}>
                      <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#0f0f1a' }}>{o.userId?.name}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{o.serviceId?.title}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: '#0f0f1a' }}>${o.serviceId?.price}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: (statusColors[o.status] || statusColors.pending).dot, display: 'block' }} />
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, ...(statusColors[o.status] || statusColors.pending) }}>
                            {statusLabel[o.status] || o.status}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <select value={o.status} onChange={e => updateOrderStatus(o._id, e.target.value)}
                          style={{ height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(220,220,240,0.8)', background: 'white', fontSize: 12, color: '#374151', cursor: 'pointer', outline: 'none' }}>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── CHATS: user list ── */}
          {activeTab === 'chats' && !selectedUser && (
            <div style={{ ...glass, padding: 0, overflow: 'hidden', boxShadow: '0 2px 12px rgba(80,80,120,0.06)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(220,220,240,0.5)' }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f0f1a' }}>All Conversations</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>Select a user to open their chat</p>
              </div>
              {users.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: '#c4c4d4', fontSize: 13 }}>No users yet</div>
              )}
              {users.map(u => {
                const uUnread = adminUnreadMap[u._id] ?? 0;
                return (
                  <div
                    key={u._id}
                    onClick={() => openChat(u)}
                    style={{
                      padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
                      borderBottom: '1px solid rgba(220,220,240,0.4)', cursor: 'pointer',
                      background: uUnread > 0 ? 'rgba(99,102,241,0.04)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.07)')}
                    onMouseLeave={e => (e.currentTarget.style.background = uUnread > 0 ? 'rgba(99,102,241,0.04)' : 'transparent')}
                  >
                    {/* Avatar with unread dot */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: '#fff',
                      }}>
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      {uUnread > 0 && (
                        <motion.div
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          style={{
                            position: 'absolute', top: -3, right: -3,
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#6366f1', border: '2px solid #fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, fontWeight: 700, color: '#fff',
                          }}
                        >
                          {uUnread > 9 ? '9+' : uUnread}
                        </motion.div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#0f0f1a', fontWeight: uUnread > 0 ? 700 : 600 }}>{u.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: uUnread > 0 ? '#6366f1' : '#9ca3af', fontWeight: uUnread > 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {uUnread > 0 ? `${uUnread} new message${uUnread > 1 ? 's' : ''}` : u.email}
                      </p>
                    </div>

                    {uUnread > 0 ? (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        style={{
                          minWidth: 20, height: 20, borderRadius: 10,
                          background: '#6366f1', color: '#fff',
                          fontSize: 10, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                          boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
                        }}
                      >
                        {uUnread > 9 ? '9+' : uUnread}
                      </motion.span>
                    ) : (
                      <ArrowRight size={14} color="#c4c4d4" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ════ Chat Panel ════ */}
        <AnimatePresence>
          {activeTab === 'chats' && selectedUser && (
            <motion.div
              key="chat-panel"
              initial={{ x: 360, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 360, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{
                width: 360, borderLeft: '1px solid rgba(220,220,240,0.6)',
                background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)',
                display: 'flex', flexDirection: 'column', flexShrink: 0,
                boxShadow: '-4px 0 24px rgba(80,80,120,0.06)',
              }}
            >
              {/* Chat Header */}
              <div style={{
                padding: '14px 16px', borderBottom: '1px solid rgba(220,220,240,0.55)',
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.9)',
              }}>
                <button onClick={closeChat} style={{
                  width: 32, height: 32, borderRadius: 9,
                  border: '1px solid rgba(220,220,240,0.8)', background: 'rgba(248,248,252,0.8)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <ChevronLeft size={15} color="#6b7280" />
                </button>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                }}>
                  {selectedUser.name?.charAt(0)?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f0f1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedUser.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'block' }} />
                    <p style={{ margin: 0, fontSize: 11, color: '#22c55e', fontWeight: 500 }}>Active now</p>
                  </div>
                </div>
                <button onClick={closeChat} style={{
                  width: 28, height: 28, borderRadius: 7, border: 'none',
                  background: 'rgba(239,68,68,0.08)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <X size={13} color="#ef4444" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} style={{
                flex: 1, overflowY: 'auto', padding: '16px 14px',
                display: 'flex', flexDirection: 'column', gap: 10,
                background: 'rgba(248,248,254,0.6)',
              }}>
                {chatMessages.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, opacity: 0.5, minHeight: 120 }}>
                    <MessageSquare size={32} color="#c4c4d4" />
                    <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>No messages yet</p>
                  </div>
                )}
                {chatMessages.map((m, i) => {
                  const isAdmin = m.sender === 'admin';
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start', gap: 8 }}>
                      {!isAdmin && (
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%', flexShrink: 0, alignSelf: 'flex-end',
                          background: 'rgba(220,220,240,0.7)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: '#9ca3af',
                        }}>
                          {selectedUser.name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div style={{
                        maxWidth: '76%', padding: '9px 13px', fontSize: 13, lineHeight: 1.5,
                        borderRadius: isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isAdmin ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.9)',
                        border: isAdmin ? 'none' : '1px solid rgba(220,220,240,0.7)',
                        color: isAdmin ? '#fff' : '#1e1e2e',
                        boxShadow: isAdmin ? '0 2px 12px rgba(99,102,241,0.2)' : '0 1px 4px rgba(0,0,0,0.04)',
                      }}>
                        {m.message}
                      </div>
                      {isAdmin && (
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%', flexShrink: 0, alignSelf: 'flex-end',
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: '#fff',
                        }}>A</div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Reply Input */}
              <form onSubmit={handleSendReply} style={{
                padding: '12px 14px', borderTop: '1px solid rgba(220,220,240,0.55)',
                display: 'flex', gap: 8, alignItems: 'center',
                background: 'rgba(255,255,255,0.88)',
              }}>
                <input
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Type a reply…"
                  style={{
                    flex: 1, height: 40, borderRadius: 12,
                    border: '1px solid rgba(220,220,240,0.7)', background: 'rgba(248,248,252,0.95)',
                    padding: '0 14px', fontSize: 13, color: '#0f0f1a', outline: 'none',
                  }}
                />
                <button type="submit" disabled={!reply.trim()} style={{
                  width: 40, height: 40, borderRadius: 12, border: 'none',
                  cursor: reply.trim() ? 'pointer' : 'not-allowed',
                  background: reply.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(220,220,240,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: reply.trim() ? '0 2px 10px rgba(99,102,241,0.3)' : 'none',
                  transition: 'all 0.2s', flexShrink: 0,
                }}>
                  <Send size={15} color={reply.trim() ? '#fff' : '#c4c4d4'} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ════ Add Service Modal ════ */}
      <AnimatePresence>
        {isAddServiceOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsAddServiceOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: 420, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(24px)', borderRadius: 22, border: '1px solid rgba(220,220,240,0.7)', padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#0f0f1a' }}>New Service</h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>Add a new service to the catalog</p>
                </div>
                <button onClick={() => setIsAddServiceOpen(false)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(220,220,240,0.8)', background: 'rgba(248,248,252,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} color="#9ca3af" />
                </button>
              </div>
              <form onSubmit={handleAddService} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Title',     key: 'title', placeholder: 'Service name' },
                  { label: 'Image URL', key: 'image', placeholder: 'https://...'  },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>
                    <input
                      style={inputStyle}
                      value={newService[key]}
                      onChange={e => setNewService({ ...newService, [key]: e.target.value })}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Description</label>
                  <textarea
                    value={newService.description}
                    onChange={e => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Service description"
                    required
                    style={{ ...inputStyle, height: 80, resize: 'none', padding: '10px 14px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Price ($)</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={newService.price}
                    onChange={e => setNewService({ ...newService, price: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setIsAddServiceOpen(false)} style={{ flex: 1, height: 42, borderRadius: 10, border: '1px solid rgba(220,220,240,0.8)', background: 'white', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ flex: 1, height: 42, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 2px 12px rgba(99,102,241,0.3)' }}>
                    Add Service
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}