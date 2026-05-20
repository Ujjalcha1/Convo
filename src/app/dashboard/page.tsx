'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import {
  MessageSquare,
  Search,
  Pin,
  Send,
  Image as ImageIcon,
  Smile,
  LogOut,
  Settings,
  X,
  UserPlus,
  Circle,
  Menu,
  ChevronRight,
  MoreVertical,
  Paperclip,
  Check,
  CheckCheck,
  Globe,
  AlertTriangle
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const {
    conversations,
    activeConversation,
    messages,
    loadingConversations,
    loadingMessages,
    socket,
    typingUsers,
    onlineUsers,
    fetchConversations,
    setActiveConversation,
    sendMessage,
    togglePin,
    markConversationAsRead
  } = useChatStore();

  // Navigation states
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals / Drawer toggles
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatarUrl || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Chat message state
  const [typedMessage, setTypedMessage] = useState('');
  const [imageMessageUrl, setImageMessageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Emoji panel toggle
  const [emojiPanelOpen, setEmojiPanelOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initial loads
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Keep profile inputs synchronized with state
  useEffect(() => {
    if (user) {
      setEditUsername(user.username);
      setEditBio(user.bio);
      setEditAvatar(user.avatarUrl);
    }
  }, [user]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Typing indicators logic
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTypedMessage(e.target.value);
    
    if (!socket || !activeConversation || !user) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing:start', {
        conversationId: activeConversation._id,
        userId: user.id,
        username: user.username,
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing:stop', {
        conversationId: activeConversation._id,
        userId: user.id,
        username: user.username,
      });
    }, 1500);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() && !imageMessageUrl) return;

    const textToSend = typedMessage;
    const imgToSend = imageMessageUrl;

    // Reset inputs immediately for responsive feedback
    setTypedMessage('');
    setImageMessageUrl('');
    setEmojiPanelOpen(false);

    // Stop typing broadcast
    if (socket && activeConversation && user) {
      setIsTyping(false);
      socket.emit('typing:stop', {
        conversationId: activeConversation._id,
        userId: user.id,
        username: user.username,
      });
    }

    await sendMessage(textToSend, imgToSend);
  };

  // Search users for new conversation
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setFoundUsers([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setFoundUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Start chat with participant
  const startNewChat = async (recipientId: string) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId }),
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh conversations sidebar
        await fetchConversations();
        // Load the new active conversation
        setActiveConversation(data.conversation);
        setNewChatModalOpen(false);
        setUserSearchQuery('');
        setFoundUsers([]);
        setMobileSidebarOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update profile handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setUpdatingProfile(true);

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editUsername,
          bio: editBio,
          avatarUrl: editAvatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Profile update failed');
      }

      setUser(data.user);
      setProfileModalOpen(false);
    } catch (err: any) {
      setProfileError(err.message || 'An error occurred during update');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Mock Upload Image (highly polished fallback that encodes as base64 or generates dynamic graphics instantly)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      // Simulate slight network delay for a high-end spinner experience
      setTimeout(() => {
        setImageMessageUrl(reader.result as string);
        setUploadingImage(false);
      }, 800);
    };
    reader.readAsDataURL(file);
  };

  // Logout handler
  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  // Filter conversations based on sidebar search input
  const filteredConversations = conversations.filter((c) => {
    const peer = c.participants.find((p) => p._id !== user?.id);
    return peer?.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Extract recipient details for current active chat
  const recipient = activeConversation?.participants.find((p) => p._id !== user?.id);
  const isRecipientOnline = recipient ? onlineUsers[recipient._id] : false;

  // Split into pinned and unpinned lists
  const pinnedConversations = filteredConversations.filter((c) =>
    user?.pinnedConversations?.includes(c._id)
  );
  const unpinnedConversations = filteredConversations.filter(
    (c) => !user?.pinnedConversations?.includes(c._id)
  );

  const emojiList = ['😀', '😂', '🔥', '👍', '❤️', '🎉', '💡', '😍', '👀', '💯', '✨', '🥺'];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b]">
      {/* 1. SIDEBAR (Left Column) - Responsive design */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-80 shrink-0 flex-col border-r border-zinc-800/80 bg-[#121216]/95 backdrop-blur-md transition-transform duration-300 md:static md:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* User profile section */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user?.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=placeholder'}
                alt="My Profile"
                className="h-10 w-10 rounded-xl border border-zinc-700 bg-zinc-800 object-cover"
              />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#121216] bg-green-500 pulse-online" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white leading-tight">{user?.username}</span>
              <span className="text-[11px] text-zinc-500 max-w-[120px] truncate">{user?.bio}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setProfileModalOpen(true)}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800/60 hover:text-white transition cursor-pointer"
              title="Profile Settings"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800/60 hover:text-red-400 transition cursor-pointer"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="flex md:hidden rounded-lg p-2 text-zinc-400 hover:bg-zinc-800/60 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search list and New Chat button */}
        <div className="flex flex-col gap-3 p-4">
          <button
            onClick={() => setNewChatModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 hover:bg-indigo-600 transition active:scale-[0.98] cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Start New Chat</span>
          </button>
          <div className="relative">
            <Search className="absolute top-2.5 left-3.5 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full rounded-xl glass-input pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loadingConversations ? (
            <div className="flex flex-col gap-2 p-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-xl bg-zinc-800" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3 w-2/3 rounded bg-zinc-800" />
                    <div className="h-2 w-1/2 rounded bg-zinc-850" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 gap-3">
              <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-650">
                <MessageSquare size={20} />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-zinc-450">No chats active</p>
                <p className="text-[10px] text-zinc-600">Click "Start New Chat" to lookup users</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Pinned chats section */}
              {pinnedConversations.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    <Pin size={10} />
                    <span>Pinned Chats</span>
                  </div>
                  {pinnedConversations.map((c) => (
                    <ConversationItem
                      key={c._id}
                      conversation={c}
                      active={activeConversation?._id === c._id}
                      myId={user?.id || ''}
                      online={onlineUsers[c.participants.find((p) => p._id !== user?.id)?._id || ''] || false}
                      onClick={() => {
                        setActiveConversation(c);
                        setMobileSidebarOpen(false);
                      }}
                      onPinToggle={() => togglePin(c._id)}
                      isPinned={true}
                    />
                  ))}
                </div>
              )}

              {/* Unpinned / Recent section */}
              <div className="flex flex-col gap-1">
                {pinnedConversations.length > 0 && (
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-550">
                    <span>Recent Chats</span>
                  </div>
                )}
                {unpinnedConversations.map((c) => (
                  <ConversationItem
                    key={c._id}
                    conversation={c}
                    active={activeConversation?._id === c._id}
                    myId={user?.id || ''}
                    online={onlineUsers[c.participants.find((p) => p._id !== user?.id)?._id || ''] || false}
                    onClick={() => {
                      setActiveConversation(c);
                      setMobileSidebarOpen(false);
                    }}
                    onPinToggle={() => togglePin(c._id)}
                    isPinned={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Backdrop overlay for mobile sidebar */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      )}

      {/* 2. CHAT WINDOW (Right Column) */}
      <main className="flex flex-1 flex-col bg-[#09090b]">
        {activeConversation ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Active chat header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition md:hidden cursor-pointer"
                >
                  <Menu size={20} />
                </button>
                <div className="relative">
                  <img
                    src={recipient?.avatarUrl}
                    alt={recipient?.username}
                    className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-900 object-cover"
                  />
                  {isRecipientOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#09090b] bg-green-500 pulse-online" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white leading-tight">{recipient?.username}</span>
                  <span className="text-[11px] text-zinc-500">
                    {isRecipientOnline ? (
                      <span className="text-green-500 font-medium">Online</span>
                    ) : (
                      'Offline'
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePin(activeConversation._id)}
                  className={`rounded-lg p-2 transition cursor-pointer ${
                    user?.pinnedConversations?.includes(activeConversation._id)
                      ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10'
                      : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={user?.pinnedConversations?.includes(activeConversation._id) ? 'Unpin Chat' : 'Pin Chat'}
                >
                  <Pin size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
              {loadingMessages ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-indigo-500" />
                </div>
              ) : (
                <>
                  {messages.map((m, idx) => {
                    const isMe = m.senderId._id === user?.id || m.senderId === user?.id;
                    const senderAvatar = isMe ? user?.avatarUrl : recipient?.avatarUrl;
                    const senderName = isMe ? user?.username : recipient?.username;

                    return (
                      <div
                        key={m._id}
                        className={`flex gap-3 max-w-[85%] sm:max-w-[70%] group ${
                          isMe ? 'self-end flex-row-reverse' : 'self-start'
                        }`}
                      >
                        <img
                          src={senderAvatar}
                          alt={senderName}
                          className="h-8 w-8 rounded-lg border border-zinc-850 bg-zinc-900 self-end shrink-0 object-cover"
                        />
                        <div className="flex flex-col gap-1">
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              isMe
                                ? 'bg-indigo-500 text-white rounded-br-sm'
                                : 'bg-zinc-900 text-zinc-100 rounded-bl-sm border border-zinc-850'
                            }`}
                          >
                            {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                            {m.imageUrl && (
                              <div className="mt-2 overflow-hidden rounded-lg border border-white/5">
                                <img
                                  src={m.imageUrl}
                                  alt="Attachment"
                                  className="max-h-60 w-auto object-cover max-w-full rounded-md"
                                />
                              </div>
                            )}
                          </div>
                          <div
                            className={`flex items-center gap-1.5 px-1 text-[10px] text-zinc-500 ${
                              isMe ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && (
                              <span>
                                {m.isOptimistic ? (
                                  <div className="h-3 w-3 animate-spin rounded-full border border-zinc-650 border-t-white" />
                                ) : m.isRead ? (
                                  <CheckCheck size={12} className="text-indigo-400" />
                                ) : (
                                  <Check size={12} className="text-zinc-500" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Real-time typing indicators layout */}
                  {typingUsers[activeConversation._id]?.length > 0 && (
                    <div className="flex items-center gap-3 self-start">
                      <img
                        src={recipient?.avatarUrl}
                        alt="typing"
                        className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-855"
                      />
                      <div className="flex items-center gap-2 rounded-2xl bg-zinc-900/60 border border-zinc-850 px-4 py-2.5">
                        <div className="flex gap-1">
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                        </div>
                        <span className="text-xs text-zinc-400 font-medium">
                          {typingUsers[activeConversation._id][0]} is typing...
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input sending area */}
            <div className="border-t border-zinc-800/80 p-4">
              <form onSubmit={handleSendMessage} className="flex flex-col gap-3 relative">
                {/* Upload Image Preview container */}
                {imageMessageUrl && (
                  <div className="relative inline-flex self-start rounded-xl border border-zinc-800 bg-zinc-900/90 p-2 gap-2">
                    <img
                      src={imageMessageUrl}
                      alt="Attachment Preview"
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageMessageUrl('')}
                      className="absolute -top-2 -right-2 rounded-full bg-zinc-800 p-1 border border-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 relative">
                  {/* Attach files / Images */}
                  <label className="flex items-center justify-center h-10 w-10 shrink-0 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-650 border-t-white" />
                    ) : (
                      <ImageIcon size={18} />
                    )}
                  </label>

                  {/* Emoji Trigger */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setEmojiPanelOpen(!emojiPanelOpen)}
                      className="flex items-center justify-center h-10 w-10 shrink-0 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
                    >
                      <Smile size={18} />
                    </button>

                    {/* Emoji panel drawer */}
                    {emojiPanelOpen && (
                      <div className="absolute bottom-12 left-0 z-55 flex gap-2 rounded-xl bg-zinc-950/95 border border-zinc-850 p-2 shadow-2xl backdrop-blur-md">
                        {emojiList.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setTypedMessage((prev) => prev + emoji);
                            }}
                            className="text-lg hover:scale-125 transition duration-100 p-1 cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Main text inputs */}
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={typedMessage}
                    onChange={handleTyping}
                    className="flex-1 rounded-xl glass-input px-4 py-2.5 text-sm text-white focus:outline-none"
                  />

                  {/* Send trigger */}
                  <button
                    type="submit"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/10 hover:bg-indigo-600 transition active:scale-[0.96] cursor-pointer"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Landing beautiful empty state */
          <div className="flex flex-1 flex-col items-center justify-center text-center p-8 gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent -z-10" />
            
            <div className="h-16 w-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2">
              <MessageSquare size={32} className="animate-bounce" />
            </div>
            
            <div className="flex flex-col gap-2 max-w-sm">
              <h2 className="text-xl font-bold tracking-tight text-white">Select a Chat Workspace</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect and sync instantly with friends in real-time. Pick an existing discussion from the sidebar or click "Start New Chat" to discover other profiles.
              </p>
            </div>
            
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex md:hidden items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs px-4 py-2 text-zinc-300 cursor-pointer"
            >
              <Menu size={14} />
              <span>Open Sidebar Channels</span>
            </button>
          </div>
        )}
      </main>

      {/* 3. NEW CHAT SEARCH DIALOG */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#121216] border border-zinc-850 p-6 flex flex-col gap-5 shadow-2xl relative">
            <button
              onClick={() => {
                setNewChatModalOpen(false);
                setUserSearchQuery('');
                setFoundUsers([]);
              }}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-lg font-bold text-white">Find new conversation</h3>
              <p className="text-xs text-zinc-400">Search users registered on the server by name or email</p>
            </div>

            <div className="relative">
              <Search className="absolute top-3 left-3.5 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Type username or email..."
                className="w-full rounded-xl glass-input pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500"
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
              />
            </div>

            <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
              {searchingUsers ? (
                <div className="flex justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-850 border-t-indigo-500" />
                </div>
              ) : foundUsers.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500">
                  {userSearchQuery ? 'No users matching criteria' : 'Start typing to locate users...'}
                </div>
              ) : (
                foundUsers.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => startNewChat(u._id)}
                    className="flex w-full items-center justify-between rounded-xl bg-zinc-900/40 border border-zinc-850/65 p-3 hover:bg-zinc-850/60 hover:border-zinc-700 transition duration-150 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatarUrl}
                        alt={u.username}
                        className="h-9 w-9 rounded-lg border border-zinc-800 bg-zinc-900 object-cover"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white leading-none">{u.username}</span>
                        <span className="text-[10px] text-zinc-500 mt-1">{u.email}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-zinc-500" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. USER PROFILE / SETTINGS DRAWER MODAL */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#121216] border border-zinc-850 p-6 flex flex-col gap-5 shadow-2xl relative">
            <button
              onClick={() => {
                setProfileModalOpen(false);
                setProfileError('');
              }}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col gap-1.5 border-b border-zinc-850 pb-3">
              <h3 className="text-lg font-bold text-white">Account Settings</h3>
              <p className="text-xs text-zinc-400">Manage your credentials, bio details, and profile avatars</p>
            </div>

            {profileError && (
              <div className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
                <AlertTriangle size={16} className="shrink-0" />
                <p>{profileError}</p>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-3">
                <img
                  src={editAvatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=avatar'}
                  alt="Avatar Preview"
                  className="h-20 w-20 rounded-2xl border border-zinc-800 bg-zinc-900 object-cover"
                />
                <div className="flex flex-col gap-1 w-full">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Avatar Seed URL</label>
                  <input
                    type="text"
                    placeholder="https://api.dicebear.com/..."
                    className="w-full rounded-lg glass-input px-3 py-2 text-xs text-white placeholder-zinc-550"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                  />
                  <span className="text-[9px] text-zinc-500 leading-normal">
                    Tip: Use any Dicebear avatar link or public image asset URL.
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Username</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg glass-input px-3 py-2 text-xs text-white"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Bio / Custom Status</label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg glass-input px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none resize-none"
                  placeholder="Tell others about yourself..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="w-full rounded-lg bg-indigo-500 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 hover:bg-indigo-600 transition active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                {updatingProfile ? 'Saving changes...' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sidebar individual list item helper component
function ConversationItem({
  conversation,
  active,
  myId,
  online,
  onClick,
  onPinToggle,
  isPinned
}: {
  conversation: any;
  active: boolean;
  myId: string;
  online: boolean;
  onClick: () => void;
  onPinToggle: (e: React.MouseEvent) => void;
  isPinned: boolean;
}) {
  const peer = conversation.participants.find((p: any) => p._id !== myId);
  const unreadCount = conversation.unreadCounts ? (conversation.unreadCounts[myId] || 0) : 0;
  
  const lastMessageText = conversation.lastMessage
    ? conversation.lastMessage.imageUrl
      ? '📷 Image attachment'
      : conversation.lastMessage.text
    : 'No messages yet';

  const timeFormatted = conversation.lastMessage
    ? new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      onClick={onClick}
      className={`group/item relative flex items-center justify-between rounded-xl p-3 transition-all duration-150 cursor-pointer ${
        active
          ? 'bg-indigo-500/15 border border-indigo-500/20 text-white'
          : 'hover:bg-zinc-900/60 border border-transparent text-zinc-350'
      }`}
    >
      <div className="flex items-center gap-3 w-[78%]">
        <div className="relative shrink-0">
          <img
            src={peer?.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=peer'}
            alt={peer?.username}
            className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-900 object-cover"
          />
          {online && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#121216] bg-green-500 pulse-online" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-white leading-tight truncate">{peer?.username}</span>
          <span
            className={`text-[10px] leading-tight truncate mt-1 ${
              unreadCount > 0 && !active ? 'text-indigo-400 font-semibold' : 'text-zinc-550'
            }`}
          >
            {lastMessageText}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0 min-w-0 select-none">
        <span className="text-[9px] text-zinc-550">{timeFormatted}</span>
        
        <div className="flex items-center gap-1">
          {/* Pin toggle button visible on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPinToggle(e);
            }}
            className="opacity-0 group-hover/item:opacity-100 rounded-md p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={10} className={isPinned ? 'fill-indigo-400 text-indigo-400' : ''} />
          </button>

          {unreadCount > 0 && !active && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-bold text-white leading-none">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
