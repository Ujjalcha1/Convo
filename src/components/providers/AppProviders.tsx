'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import SocketProvider from './SocketProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const { checkSession, loading } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#09090b] text-white">
        <div className="flex flex-col items-center gap-4">
          {/* Glassmorphic premium spinner */}
          <div className="relative flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-800 border-t-indigo-500"></div>
            <div className="absolute h-6 w-6 animate-ping rounded-full bg-indigo-500/10"></div>
          </div>
          <p className="text-sm font-semibold tracking-wider text-zinc-400 animate-pulse">
            AUTHENTICATING SESSION...
          </p>
        </div>
      </div>
    );
  }

  return <SocketProvider>{children}</SocketProvider>;
}
export default AppProviders;
