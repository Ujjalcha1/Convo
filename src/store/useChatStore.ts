import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

interface Participant {
  _id: string;
  username: string;
  email: string;
  avatarUrl: string;
  bio: string;
  isOnline: boolean;
  lastActive: string | Date;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: Participant | string | any;
  text: string;
  imageUrl?: string;
  isRead: boolean;
  readBy: string[];
  createdAt: string;
  isOptimistic?: boolean;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  lastMessage?: Message;
  unreadCounts: { [userId: string]: number } | any;
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  page: number;
  hasMore: boolean;
  loadingConversations: boolean;
  loadingMessages: boolean;
  socket: any | null;
  typingUsers: { [conversationId: string]: string[] }; // Map of conversationId -> array of usernames typing
  onlineUsers: { [userId: string]: boolean };
  setSocket: (socket: any) => void;
  fetchConversations: () => Promise<void>;
  setActiveConversation: (conversation: Conversation | null) => void;
  fetchMessages: (conversationId: string, pageNum?: number) => Promise<void>;
  sendMessage: (text: string, imageUrl?: string) => Promise<void>;
  addMessage: (message: Message) => void;
  updateUserStatus: (userId: string, isOnline: boolean, lastActive?: string | Date) => void;
  setTyping: (conversationId: string, userId: string, username: string, isTyping: boolean) => void;
  togglePin: (conversationId: string) => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  page: 1,
  hasMore: false,
  loadingConversations: false,
  loadingMessages: false,
  socket: null,
  typingUsers: {},
  onlineUsers: {},

  setSocket: (socket) => set({ socket }),

  fetchConversations: async () => {
    set({ loadingConversations: true });
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      
      const onlineMap: { [userId: string]: boolean } = {};
      const conversations = data.conversations || [];
      
      conversations.forEach((c: Conversation) => {
        c.participants?.forEach((p: Participant) => {
          onlineMap[p._id] = p.isOnline;
        });
      });

      set({
        conversations,
        onlineUsers: { ...get().onlineUsers, ...onlineMap },
        loadingConversations: false,
      });
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      set({ loadingConversations: false });
    }
  },

  setActiveConversation: (conversation) => {
    const previous = get().activeConversation;
    const socket = get().socket;

    if (socket) {
      if (previous) {
        socket.emit('leave:conversation', { conversationId: previous._id });
      }
      if (conversation) {
        socket.emit('join:conversation', { conversationId: conversation._id });
        // Mark the messages as read on server instantly
        get().markConversationAsRead(conversation._id);
      }
    }

    set({
      activeConversation: conversation,
      messages: [],
      page: 1,
      hasMore: false,
    });

    if (conversation) {
      get().fetchMessages(conversation._id, 1);
    }
  },

  fetchMessages: async (conversationId, pageNum = 1) => {
    set({ loadingMessages: true });
    try {
      const res = await fetch(`/api/messages?conversationId=${conversationId}&page=${pageNum}&limit=30`);
      const data = await res.json();

      set((state) => ({
        messages: pageNum === 1 ? data.messages : [...data.messages, ...state.messages],
        page: pageNum,
        hasMore: data.hasMore,
        loadingMessages: false,
      }));
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      set({ loadingMessages: false });
    }
  },

  sendMessage: async (text, imageUrl = '') => {
    const { activeConversation, socket } = get();
    if (!activeConversation) return;

    const authState = useAuthStore.getState();
    const currentUser = authState.user;
    if (!currentUser) return;

    // Optimistic UI updates
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      conversationId: activeConversation._id,
      senderId: {
        _id: currentUser.id,
        username: currentUser.username,
        avatarUrl: currentUser.avatarUrl,
        email: currentUser.email,
        bio: currentUser.bio,
        isOnline: true,
        lastActive: new Date(),
      },
      text,
      imageUrl,
      isRead: false,
      readBy: [currentUser.id],
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConversation._id, text, imageUrl }),
      });
      const data = await res.json();
      
      // Replace optimistic message bubble with saved database bubble
      set((state) => ({
        messages: state.messages.map((m) => m.isOptimistic && m.conversationId === activeConversation._id ? data.message : m),
      }));

      // Broadcast saved message over WebSocket room
      if (socket) {
        socket.emit('message:send', {
          ...data.message,
          participants: activeConversation.participants.map((p: Participant) => p._id),
        });
      }

      // Update sidebar preview
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c._id === activeConversation._id
            ? { ...c, lastMessage: data.message, updatedAt: new Date().toISOString() }
            : c
        ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
      }));

    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic bubble upon failures
      set((state) => ({
        messages: state.messages.filter((m) => !m.isOptimistic),
      }));
    }
  },

  addMessage: (message) => {
    console.log('Zustand store [addMessage] invoked with message:', message);
    const { activeConversation, conversations, fetchConversations } = get();

    // If the conversation doesn't exist in our current sidebar list, fetch all conversations to register it
    const conversationExists = conversations.some((c) => c._id === message.conversationId);
    console.log('Zustand store: Does conversation exist in sidebar?', conversationExists);

    if (!conversationExists) {
      console.log('Zustand store: Conversation not found in list. Re-fetching conversations sidebar...');
      fetchConversations();
      return;
    }

    const isActive = activeConversation && message.conversationId === activeConversation._id;
    console.log('Zustand store: Is conversation currently active?', isActive);

    if (isActive) {
      // Append message to active chat window
      set((state) => ({
        messages: [...state.messages, message],
      }));
      get().markConversationAsRead(activeConversation._id);
    }

    // Update the sidebar conversation list: increment unread if inactive, update lastMessage, and sort to top
    set((state) => {
      const updatedConversations = state.conversations.map((c) => {
        if (c._id === message.conversationId) {
          const unreads = { ...(c.unreadCounts || {}) };
          if (!isActive) {
            const currentUser = useAuthStore.getState().user;
            const currentUserId = currentUser?.id || '';
            unreads[currentUserId] = (unreads[currentUserId] || 0) + 1;
            console.log(`Zustand store: Incremented unread count for user ${currentUserId} to:`, unreads[currentUserId]);
          }
          return {
            ...c,
            unreadCounts: unreads,
            lastMessage: message,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      return { conversations: updatedConversations };
    });
  },

  updateUserStatus: (userId, isOnline, lastActive) => {
    set((state) => {
      const updatedOnline = { ...state.onlineUsers };
      updatedOnline[userId] = isOnline;

      const conversations = state.conversations.map((c) => {
        const participants = c.participants?.map((p) => {
          if (p._id === userId) {
            return { ...p, isOnline, lastActive: lastActive || new Date() };
          }
          return p;
        });
        return { ...c, participants };
      });

      let activeConversation = state.activeConversation;
      if (activeConversation) {
        const participants = activeConversation.participants?.map((p) => {
          if (p._id === userId) {
            return { ...p, isOnline, lastActive: lastActive || new Date() };
          }
          return p;
        });
        activeConversation = { ...activeConversation, participants };
      }

      return {
        onlineUsers: updatedOnline,
        conversations,
        activeConversation,
      };
    });
  },

  setTyping: (conversationId, userId, username, isTyping) => {
    set((state) => {
      const currentList = state.typingUsers[conversationId] || [];
      let newList: string[];

      if (isTyping) {
        newList = currentList.includes(username) ? currentList : [...currentList, username];
      } else {
        newList = currentList.filter((name) => name !== username);
      }

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: newList,
        },
      };
    });
  },

  togglePin: async (conversationId) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/pin`, { method: 'PUT' });
      const data = await res.json();
      
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        useAuthStore.getState().setUser({
          ...authUser,
          pinnedConversations: data.pinnedConversations,
        });
      }
    } catch (err) {
      console.error('Failed to toggle pin state:', err);
    }
  },

  markConversationAsRead: async (conversationId) => {
    try {
      await fetch('/api/messages/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      const currentUser = useAuthStore.getState().user;
      const currentUserId = currentUser?.id || '';

      set((state) => ({
        conversations: state.conversations.map((c) => {
          if (c._id === conversationId) {
            const unreads = { ...(c.unreadCounts || {}) };
            unreads[currentUserId] = 0;
            return { ...c, unreadCounts: unreads };
          }
          return c;
        }),
      }));
    } catch (err) {
      console.error('Failed to clear unread counts:', err);
    }
  },
}));
