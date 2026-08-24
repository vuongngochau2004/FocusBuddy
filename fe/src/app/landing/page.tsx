'use client';

import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TrustStrip from './components/TrustStrip';
import Features from './components/Features';
import ArchitectureAnimation from './components/ArchitectureAnimation';
import InteractiveAgents from './components/InteractiveAgents';
import Personalization from './components/Personalization';
import WorkflowOCR from './components/WorkflowOCR';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f7ff] text-slate-900 overflow-x-hidden font-sans">
      <Navbar />
      <main className="relative">
        <Hero />
        <TrustStrip />
        <Features />
        <ArchitectureAnimation />
        <InteractiveAgents />
        <Personalization />
        <WorkflowOCR />
      </main>
    </div>
  );
}
