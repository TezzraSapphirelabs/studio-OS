import React from 'react';
import { GlassCard } from './glass-card';
import { Button } from '@/components/ui/button';

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
        <Button
          onClick={onAction}
          variant={primary ? 'primary' : 'default'}
          className="gap-2"
        >
          {actionIcon}
          {actionLabel}
        </Button>
      )}
    </GlassCard>
  );
}

