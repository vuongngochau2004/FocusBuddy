'use client';

import React from 'react';
import Navbar from './components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f7ff] text-slate-900 overflow-x-hidden font-sans">
      <Navbar />
      <main className="relative">
        <div className="py-20 text-center">FocusBuddy Landing Page Shell</div>
      </main>
    </div>
  );
}
