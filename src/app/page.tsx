import { redirect } from 'next/navigation';

export default function Home() {
  // Direct entry points automatically flow to the dashboard
  // Middleware handles JWT authentication protection redirects
  redirect('/dashboard');
}
