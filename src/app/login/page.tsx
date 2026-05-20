'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageSquare, Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setUser(data.user);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Invalid credentials provided');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#09090b] px-4 overflow-hidden">
      {/* Visual Backdrops */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-zinc-950 to-zinc-950 -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] -z-10" />

      {/* Glass Card Box */}
      <div className="w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl flex flex-col gap-6 relative border border-zinc-800/80">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2">
            <MessageSquare size={24} className="animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="text-sm text-zinc-400">Log in to enter your active chat workspaces</p>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-400">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300 tracking-wide uppercase">Email or Username</label>
            <input
              type="text"
              required
              placeholder="e.g. janesmith or jane@gmail.com"
              className="w-full rounded-lg glass-input px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-semibold text-zinc-300 tracking-wide uppercase">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="w-full rounded-lg glass-input pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-lg bg-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 focus:outline-none transition active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Logging in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-400">
          Don't have an account yet?{' '}
          <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition">
            Sign Up
          </Link>
        </div>

        <div className="border-t border-zinc-800/60 pt-4 flex items-center justify-center gap-2 text-[10px] text-zinc-500 uppercase tracking-wider">
          <Shield size={12} />
          <span>Secured with custom JWT credentials</span>
        </div>
      </div>
    </div>
  );
}
