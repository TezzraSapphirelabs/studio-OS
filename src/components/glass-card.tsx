// ============================================================
// Studio OS — Glassmorphic Card Component
// ============================================================

import React from 'react';

import Link from 'next/link';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  href?: string;
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function GlassCard({ children, className = '', hover = false, padding = 'md', href }: GlassCardProps) {
  const classes = `
        relative overflow-hidden rounded-2xl
        border border-white/[0.08]
        bg-white/[0.04] backdrop-blur-xl
        transition-all duration-300
        ${hover ? 'hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-0.5' : ''}
        ${paddingMap[padding]}
        ${className}
      `.trim();

  if (href) {
    return (
      <Link href={href} className={`block ${classes}`}>
        {children}
      </Link>
    );
  }

  return (
    <div className={classes}>
      {children}
    </div>
  );
}
