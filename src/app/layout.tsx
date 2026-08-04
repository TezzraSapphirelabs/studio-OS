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
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Velonos CPM | Creative Project Management Platform',
  description: 'Velonos CPM is a modern creative project management platform for creative teams, agencies, freelancers, and studios.',
  keywords: ['project management', 'creative tools', 'task tracking', 'team collaboration', 'Creative Project Management'],
  metadataBase: new URL('https://velonos.dpdns.org'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://velonos.dpdns.org',
    title: 'Velonos CPM',
    description: 'Modern creative project management platform.',
    siteName: 'Velonos CPM',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Velonos CPM',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Velonos CPM',
    description: 'Modern creative project management platform.',
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['WebSite', 'Organization'],
    name: 'Velonos CPM',
    alternateName: 'Velonos',
    url: 'https://velonos.dpdns.org',
    logo: 'https://velonos.dpdns.org/og-image.jpg',
    description: 'Velonos CPM is a modern creative project management platform for creative teams, agencies, freelancers, and studios.',
  };

  return (
    <html lang="en" className={`${inter.variable} dark antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
