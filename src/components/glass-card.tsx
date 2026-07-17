// ============================================================
// Studio OS — Glassmorphic Card Component
// ============================================================

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function GlassCard({ children, className = '', hover = false, padding = 'md' }: GlassCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        border border-white/[0.08]
        bg-white/[0.04] backdrop-blur-xl
        shadow-[0_8px_32px_rgba(0,0,0,0.12)]
        ${hover ? 'transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06] hover:shadow-[0_8px_40px_rgba(0,0,0,0.2)] hover:-translate-y-0.5' : ''}
        ${paddingMap[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
