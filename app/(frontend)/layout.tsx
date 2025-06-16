import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO Metadata
export const metadata: Metadata = {
  title: {
    default: "Time Capsule Creator - Seal Memories for the Future",
    template: "%s | Time Capsule Creator"
  },
  description: "Create digital time capsules with photos, voice messages, and text. Set them to open at the perfect moment in the future. Preserve your memories for just $1.",
  keywords: [
    "time capsule",
    "digital memories",
    "future messages",
    "memory preservation",
    "photo storage",
    "voice messages",
    "digital diary",
    "future self",
    "memory keeper",
    "time travel messages"
  ],
  authors: [{ name: "Time Capsule Creator Team" }],
  creator: "Time Capsule Creator",
  publisher: "Time Capsule Creator",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Time Capsule Creator - Seal Memories for the Future',
    description: 'Create digital time capsules with photos, voice messages, and text. Set them to open at the perfect moment in the future. Preserve your memories for just $1.',
    siteName: 'Time Capsule Creator',
    images: [
      {
        url: '/time_capsule.png',
        width: 1200,
        height: 630,
        alt: 'Time Capsule Creator - Digital Memory Preservation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Time Capsule Creator - Seal Memories for the Future',
    description: 'Create digital time capsules with photos, voice messages, and text. Set them to open at the perfect moment in the future.',
    images: ['/time_capsule.png'],
    creator: '@timecapsul',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/time_capsule.png', sizes: '32x32', type: 'image/png' },
      { url: '/time_capsule.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/time_capsule.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/time_capsule.png',
  },
  manifest: '/manifest.json',
  category: 'productivity',
  classification: 'Digital Memory Preservation',
  referrer: 'origin-when-cross-origin',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  colorScheme: 'light',
};

// Structured Data JSON-LD
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Time Capsule Creator",
  "description": "Create digital time capsules with photos, voice messages, and text. Set them to open at the perfect moment in the future.",
  "url": process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  "applicationCategory": "ProductivityApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "1.00",
    "priceCurrency": "USD",
    "description": "Complete Memory Capsule with photos, voice messages, video messages, and multiple recipients"
  },
  "creator": {
    "@type": "Organization",
    "name": "Time Capsule Creator",
    "url": process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  },
  "featureList": [
    "Text Messages",
    "Photo Storage", 
    "Voice Messages",
    "Video Messages",
    "Multiple Recipients",
    "Scheduled Delivery",
    "Password Protection",
    "Public Gallery Sharing"
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/time_capsule.png" sizes="any" />
        <link rel="apple-touch-icon" href="/time_capsule.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
