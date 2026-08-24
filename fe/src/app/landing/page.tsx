'use client';

import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TrustStrip from './components/TrustStrip';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f7ff] text-slate-900 overflow-x-hidden font-sans">
      <Navbar />
      <main className="relative">
        <Hero />
        <TrustStrip />
      </main>
    </div>
  );
}
