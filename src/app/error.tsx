'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 rounded-full bg-red-500/10 p-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="mb-2 text-xl font-bold text-white">Something went wrong!</h2>
      <p className="mt-4 text-white/50 text-sm max-w-sm">
        We&apos;re sorry, but something unexpected happened. You can try recovering by clicking the button below, or return home.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
