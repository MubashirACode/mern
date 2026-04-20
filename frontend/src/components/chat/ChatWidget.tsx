'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

export function ChatWidget() {
  const [message, setMessage] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const { user } = useAuthStore();

  const {
    messages,
    initSocket,
    sendMessage,
    fetchMessages,
    markAsSeen,
    isTyping,
    userUnreadCount,
    lastAdminMessage,   // ← Bug 2 fix: popup ke liye
    setWidgetOpen,      // ← store mein open state track karo
    clearUserUnread,
  } = useChatStore();

  const scrollRef   = useRef(null);
  // ── isOpen local state — lekin har change pe store ko bhi batao ──
  const [isOpen, setIsOpenLocal] = useState(false);

  const setIsOpen = (val) => {
    setIsOpenLocal(val);
    setWidgetOpen(val);        // store sync
    if (val && user?._id) {
      markAsSeen(user._id);   // backend pe seen mark karo
    }
  };

  // ── Popup: store ke lastAdminMessage se driven ──────────────────
  // Bug 2 fix: pehle ChatWidget ke useEffect mein messages watch
  // karta tha — ab store khud set karta hai lastAdminMessage
  // Yahan sirf auto-dismiss timer lagao
  const popupTimerRef = useRef(null);

  useEffect(() => {
    if (!lastAdminMessage) return;
    // Purana timer clear karo
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    // 5 seconds mein dismiss
    popupTimerRef.current = setTimeout(() => {
      clearUserUnread();
    }, 5000);
    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, [lastAdminMessage]);

  // ── Init socket + fetch (only once) ─────────────────────────────
  useEffect(() => {
    if (user && user.role !== 'admin') {
      initSocket(user._id, user.role);
      // Bug 3 fix: fetchMessages ke andar ab baseline set hoti hai
      // toh reload pe purane messages unread count mein nahi jayenge
      fetchMessages(user._id);
    }
  }, [user]);

  // ── Auto scroll ─────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // ── Cleanup on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, []);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!message.trim() || !user) return;
    sendMessage(user._id, 'user', message);
    setMessage('');
  };

  if (!user || user.role === 'admin') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-[360px] h-[520px] bg-white/90 backdrop-blur-2xl border border-gray-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-white/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <MessageCircle size={18} color="#fff" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Support Chat</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-gray-500">Typically replies in minutes</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/60">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-4">
                    <MessageCircle size={24} color="#fff" />
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">How can we help?</p>
                  <p className="text-xs text-gray-500 mt-1">Send a message to get started</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'admin' && (
                    <div className="flex items-end gap-2 max-w-[75%]">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                        A
                      </div>
                      <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-none text-sm text-gray-800 shadow-sm">
                        {msg.message}
                      </div>
                    </div>
                  )}
                  {msg.sender === 'user' && (
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-none max-w-[80%] text-sm shadow-md">
                      {msg.message}
                    </div>
                  )}
                </div>
              ))}

              {/* AI Thinking */}
              {isAiThinking && (
                <div className="flex items-center gap-2">
                  <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 size={13} className="animate-spin" />
                    AI is thinking…
                  </div>
                </div>
              )}

              {/* AI Suggestion */}
              {aiSuggestion && !isAiThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={13} className="text-indigo-600" />
                    <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase">AI Suggestion</span>
                  </div>
                  <p className="text-indigo-700 text-xs leading-relaxed">{aiSuggestion}</p>
                  <button
                    onClick={() => setAiSuggestion(null)}
                    className="text-indigo-400 text-[11px] mt-2 hover:text-indigo-600 transition"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}

              {/* Admin Typing */}
              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold">
                    A
                  </div>
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white/80 flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message…"
                className="flex-1 h-11 px-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 transition"
              />
              <button
                type="submit"
                className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-md hover:shadow-lg transition flex-shrink-0"
              >
                <Send size={16} color="#fff" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Message Popup Preview ────────────────────────────────── */}
      {/*
        Bug 2 fix:
        - Pehle: ChatWidget mein messages watch karta tha aur prevAdminMsgCountRef
          se compare karta tha — lekin yeh fetchMessages ke baad bhi trigger hota tha
        - Ab: store mein lastAdminMessage set hota hai SIRF socket event pe,
          aur SIRF tab jab _widgetOpen === false ho. ChatWidget sirf
          lastAdminMessage ko render karta hai.
      */}
      <AnimatePresence>
        {!isOpen && lastAdminMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={() => {
              setIsOpen(true);
            }}
            className="w-[280px] bg-white backdrop-blur-xl border border-gray-200 rounded-[18px] shadow-2xl cursor-pointer relative overflow-hidden"
          >
            {/* Dismiss X */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearUserUnread(); // lastAdminMessage bhi reset hoga
                if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
              }}
              className="absolute top-3 right-3 w-5 h-5 rounded-full bg-black/[0.07] flex items-center justify-center hover:bg-black/10 transition z-10"
            >
              <X size={10} color="#9ca3af" />
            </button>

            <div className="p-4 pb-3">
              {/* Sender row */}
              <div className="flex items-center gap-3 mb-3 pr-6">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  A
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Support Team</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span className="text-[10px] text-green-600 font-semibold">Just now</span>
                  </div>
                </div>
              </div>

              {/* Message text — max 2 lines */}
              <p
                className="text-sm text-gray-700 leading-relaxed mb-3"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {lastAdminMessage.text}
              </p>

              {/* Reply hint */}
              <div className="flex items-center justify-between pb-3">
                <span className="text-[11px] text-gray-400">Tap to reply</span>
                <div className="h-6 px-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center text-[10px] font-bold text-white">
                  Open Chat
                </div>
              </div>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              key={lastAdminMessage.id}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-indigo-500 to-violet-600"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toggle Button ── */}
      <div className="relative">
        {/* Unread badge */}
        <AnimatePresence>
          {!isOpen && userUnreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1.5 -right-1.5 z-10 min-w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow px-1"
            >
              {userUnreadCount > 9 ? '9+' : userUnreadCount}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all ${
            isOpen
              ? 'bg-white border border-gray-200 text-indigo-600'
              : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white'
          }`}
        >
          {isOpen ? <X size={22} /> : <MessageCircle size={24} />}
        </motion.button>
      </div>
    </div>
  );
}