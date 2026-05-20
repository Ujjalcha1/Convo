'use client';

import React, { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  const { setSocket, addMessage, updateUserStatus, setTyping } = useChatStore();

  useEffect(() => {
    if (!user) {
      setSocket(null);
      return;
    }

    // Connect to WebSocket server running on same origin
    const socketInstance = io(window.location.origin, {
      transports: ['websocket'],
      autoConnect: true,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Socket client connected successfully');
      // Associate socket session with logged-in user
      socketInstance.emit('user:register', { userId: user.id });
    });

    // Listen for real-time messages
    socketInstance.on('message:received', (message) => {
      console.log('Received real-time message:', message);
      addMessage(message);
    });

    // Listen for online status updates
    socketInstance.on('user:status', ({ userId, isOnline, lastActive }) => {
      console.log(`Presence broadcast: User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
      updateUserStatus(userId, isOnline, lastActive);
    });

    // Listen for typing events
    socketInstance.on('typing:start', ({ conversationId, userId, username }) => {
      setTyping(conversationId, userId, username || 'Someone', true);
    });

    socketInstance.on('typing:stop', ({ conversationId, userId, username }) => {
      setTyping(conversationId, userId, username || 'Someone', false);
    });

    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [user, setSocket, addMessage, updateUserStatus, setTyping]);

  return <>{children}</>;
};
export default SocketProvider;
