import React from 'react';
import { GlassCard } from './glass-card';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  className?: string;
  primary?: boolean;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  actionIcon, 
  onAction,
  className = '',
  primary = false,
}: EmptyStateProps) {
  return (
    <GlassCard padding="lg" className={`flex flex-col items-center justify-center py-20 text-center ${className}`}>
      <div className={`mb-5 flex h-20 w-20 items-center justify-center rounded-2xl shadow-inner ${
        primary ? 'bg-white/[0.04] text-white/70' : 'bg-white/[0.04] text-white/40'
      }`}>
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-white/40">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={`inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all active:scale-[0.98] ${
            primary 
              ? 'bg-white   text-black shadow-lg shadow-white/10 hover:shadow-white/20 hover:brightness-110'
              : 'bg-white/[0.08] hover:bg-white/[0.12] text-white'
          }`}
        >
          {actionIcon}
          {actionLabel}
        </button>
      )}
    </GlassCard>
  );
}
