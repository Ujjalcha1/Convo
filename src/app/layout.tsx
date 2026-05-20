import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AppProviders from '@/components/providers/AppProviders';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Convo - Premium Real-Time Chat Platform',
  description: 'A modern, full-stack, real-time messaging SaaS dashboard inspired by Discord, Slack, and WhatsApp Web.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-[#09090b] text-[#ededed] flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
