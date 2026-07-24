import React from 'react';
import { GlassCard } from './glass-card';
import { XIcon } from './icons';

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className = '' }: ErrorStateProps) {
  return (
    <GlassCard padding="lg" className={`flex flex-col items-center justify-center py-20 text-center ${className}`}>
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.04] text-white/70 shadow-inner">
        <XIcon size={36} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">Something went wrong</h3>
      <p className="mb-6 max-w-sm text-sm text-white/40">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/[0.06] px-5 text-sm font-medium text-white transition-all hover:bg-white/[0.1] active:scale-[0.98]"
        >
          Retry
        </button>
      )}
    </GlassCard>
  );
}
