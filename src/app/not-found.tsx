import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
      <h2 className="mb-2 text-4xl font-bold text-white">404</h2>
      <h3 className="mb-4 text-xl font-medium text-white/80">Page not found</h3>
      <p className="mt-4 text-white/50 text-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="rounded-xl bg-white text-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-white text-black"
      >
        Return Home
      </Link>
    </div>
  );
}
