import { create } from 'zustand';
import { io } from 'socket.io-client';
import api from '../api/axios';

// ─────────────────────────────────────────────────────────────────
//  KEY FIX EXPLANATION:
//
//  Bug 1 — Admin unread after seen:
//    BEFORE: socket event pe blindly adminUnreadMap[userId]++ karo
//    FIX:    store mein `openChatUserId` track karo. Agar admin ne
//            woh user ka chat khola hua hai toh increment mat karo.
//
//  Bug 2 — User popup nahi aata:
//    BEFORE: store mein sirf userUnreadCount tha, popup trigger
//            karne ka koi mechanism nahi tha
//    FIX:    store mein `lastAdminMessage` field rakho. Jab naya
//            admin message aaye aur widget band ho toh yeh set ho.
//            ChatWidget isko watch karke popup show karega.
//
//  Bug 3 — Reload pe duplicate unread:
//    BEFORE: fetchMessages ke baad prevAdminMsgCountRef 0 tha,
//            toh pehli render pe saare admin messages "new" lagte the
//    FIX:    fetchMessages ke baad store mein `seenAdminMsgCount`
//            set karo — yeh "baseline" hai. Socket event sirf
//            fetchMessages ke BAAD aane wale messages count karega.
// ─────────────────────────────────────────────────────────────────

export const useChatStore = create((set, get) => ({
  messages: [],
  socket: null,
  isTyping: false,

  // Admin side: per-user unread counts
  adminUnreadMap: {},
  // Admin side: currently open chat userId (taake socket event mein skip karein)
  openChatUserId: null,

  // User side: unread count from admin
  userUnreadCount: 0,
  // User side: latest admin message for popup preview
  // { text: string, id: string } — ChatWidget isko watch karega
  lastAdminMessage: null,
  // User side: baseline — fetchMessages ke time kitne admin msgs the
  // Reload pe in messages ko "unread" count nahi karna
  _seenAdminMsgCount: 0,
  // User side: widget open hai ya nahi (store mein track karo)
  _widgetOpen: false,

  /* ── User side actions ─────────────────────────────────────── */

  setWidgetOpen: (open) => {
    set({ _widgetOpen: open });
    if (open) {
      // Widget khula → unread reset, popup dismiss
      set({ userUnreadCount: 0, lastAdminMessage: null });
    }
  },

  clearUserUnread: () => {
    set({ userUnreadCount: 0, lastAdminMessage: null });
  },

  /* ── Admin side actions ────────────────────────────────────── */

  setOpenChatUserId: (userId) => {
    set({ openChatUserId: userId });
    if (userId) {
      // Chat khola → us user ka unread 0 karo
      set(state => ({
        adminUnreadMap: { ...state.adminUnreadMap, [userId]: 0 },
      }));
    }
  },

  clearAdminUnread: (userId) => {
    set(state => ({
      adminUnreadMap: { ...state.adminUnreadMap, [userId]: 0 },
    }));
  },

  /* ── Socket init ───────────────────────────────────────────── */

  initSocket: (userId, role) => {
    const existing = get().socket;
    if (existing?.connected) return;

    if (existing) {
      existing.removeAllListeners();
      existing.close();
    }

    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    if (role === 'admin') {
      socket.emit('admin_join');
    } else {
      socket.emit('join', userId);
    }

    // ── USER receives message from ADMIN ─────────────────────────
    socket.on('receive_message', (msg) => {
      set(state => {
        // Duplicate check
        if (msg._id && state.messages.find(m => m._id === msg._id)) return state;

        const isAdminMsg = msg.sender === 'admin';

        // Bug 3 fix: sirf socket se aane wale NAYE messages count karo
        // (fetchMessages ke baad baseline set ho jaata hai _seenAdminMsgCount mein)
        // Agar yeh message already fetched messages mein se hai toh count mat karo
        // Socket messages ke paas _id hota hai jo fetched messages mein bhi hoga
        // Hum duplicate check se already handle kar rahe hain — agar duplicate nahi
        // toh yeh genuinely naya socket message hai

        const newMessages = [...state.messages, msg];

        if (!isAdminMsg) {
          return { messages: newMessages };
        }

        // Widget band hai → unread++ aur popup set karo
        if (!state._widgetOpen) {
          return {
            messages: newMessages,
            userUnreadCount: state.userUnreadCount + 1,
            lastAdminMessage: { text: msg.message, id: msg._id ?? Date.now().toString() },
          };
        }

        // Widget khula hai → sirf message add karo, unread mat badao
        return { messages: newMessages };
      });
    });

    // ── ADMIN receives message from USER ─────────────────────────
    socket.on('receive_message_admin', (msg) => {
      set(state => {
        if (msg._id && state.messages.find(m => m._id === msg._id)) return state;

        const senderId = msg.userId?._id ?? msg.userId ?? '';

        const newMessages = [...state.messages, msg];

        // Bug 1 fix: agar admin ne is user ka chat khola hua hai toh increment mat karo
        if (state.openChatUserId === senderId) {
          return { messages: newMessages };
        }

        return {
          messages: newMessages,
          adminUnreadMap: {
            ...state.adminUnreadMap,
            [senderId]: (state.adminUnreadMap[senderId] ?? 0) + 1,
          },
        };
      });
    });

    socket.on('admin_typing', ({ isTyping }) => {
      set({ isTyping });
    });

    socket.on('disconnect', () => console.warn('Socket disconnected'));
    socket.on('connect_error', (err) => console.error('Socket error:', err));

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        messages: [],
        adminUnreadMap: {},
        userUnreadCount: 0,
        lastAdminMessage: null,
        openChatUserId: null,
        _widgetOpen: false,
        _seenAdminMsgCount: 0,
      });
    }
  },

  sendMessage: (userId, sender, message) => {
    const { socket } = get();
    if (!socket) return;
    if (sender === 'admin') {
      socket.emit('admin_reply', { userId, message });
    } else {
      socket.emit('send_message', { userId, sender, message });
    }
  },

  // Bug 3 fix: fetch ke baad baseline set karo
  fetchMessages: async (userId) => {
    try {
      const { data } = await api.get(`/messages/${userId}`);
      // Kitne admin messages pehle se hain — yeh "already seen" hain
      const seenCount = data.filter((m) => m.sender === 'admin').length;
      set({
        messages: data,
        _seenAdminMsgCount: seenCount,
        // Reload pe unread 0 karo — sirf socket se aane wale new messages count honge
        userUnreadCount: 0,
        lastAdminMessage: null,
      });
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  },

  markAsSeen: async (userId) => {
    try {
      await api.put(`/messages/seen/${userId}`);
    } catch (err) {
      console.error('markAsSeen error:', err);
    }
  },
}));