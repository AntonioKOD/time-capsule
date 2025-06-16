import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Memory Capsule Creator - Preserve Your Memories for the Future",
  description: "Create digital time capsules with your thoughts, photos, and voice messages. Set them to open at the perfect moment in the future.",
  keywords: ["time capsule", "memories", "digital preservation", "future messages", "photo storage"],
  authors: [{ name: "Memory Capsule Creator" }],
  creator: "Memory Capsule Creator",
  openGraph: {
    title: "Memory Capsule Creator - Preserve Your Memories for the Future",
    description: "Create digital time capsules with your thoughts, photos, and voice messages. Set them to open at the perfect moment in the future.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Memory Capsule Creator - Preserve Your Memories for the Future",
    description: "Create digital time capsules with your thoughts, photos, and voice messages. Set them to open at the perfect moment in the future.",
  },
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
