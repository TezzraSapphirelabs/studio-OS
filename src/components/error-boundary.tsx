'use client';

import React, { Component, ReactNode } from 'react';
import { GlassCard } from './glass-card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <GlassCard padding="lg" className="border-red-500/20 bg-red-500/[0.02] flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 rounded-full bg-red-500/10 p-3 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-red-500">Component Error</h2>
          <p className="mt-2 text-sm text-white/50 max-w-sm">
            {this.state.error?.message || 'An unexpected error occurred in this component.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-6 rounded-xl bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.1]"
          >
            Try Again
          </button>
        </GlassCard>
      );
    }

    return this.props.children;
  }
}
