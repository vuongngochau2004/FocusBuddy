'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from './landing/page';

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('focusbuddy_user_id');
    if (userId) {
      setIsAuthenticated(true);
      router.replace('/dashboard');
    } else {
      setIsAuthenticated(false);
    }
  }, [router]);

  // Show a clean loading state only during active redirect to prevent layout flashing
  if (isAuthenticated === null || isAuthenticated === true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-pulse text-white/50 text-lg font-bold">Đang tải...</div>
      </div>
    );
  }

  return <LandingPage />;
}
