'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    const userId = localStorage.getItem('focusbuddy_user_id');
    if (userId) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-white/50 text-lg">Đang tải...</div>
    </div>
  );
}
