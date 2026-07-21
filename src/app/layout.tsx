import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { ToastProvider } from '@/contexts/toast-context';
import { SearchProvider } from '@/contexts/search-context';
import './globals.css';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#8b5cf6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Studio OS — Creative Project Management',
  description: 'A modern project management operating system for creative teams. Organize projects, track tasks, and collaborate seamlessly.',
  keywords: ['project management', 'creative tools', 'task tracking', 'team collaboration'],
  metadataBase: new URL('https://studio-os.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://studio-os.com',
    title: 'Studio OS — Creative Project Management',
    description: 'A modern project management operating system for creative teams. Organize projects, track tasks, and collaborate seamlessly.',
    siteName: 'Studio OS',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Studio OS Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Studio OS — Creative Project Management',
    description: 'A modern project management operating system for creative teams. Organize projects, track tasks, and collaborate seamlessly.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark antialiased`}>
      <body className="min-h-screen bg-background text-foreground">
        <ToastProvider>
          <AuthProvider>
            <SearchProvider>
              {children}
            </SearchProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
