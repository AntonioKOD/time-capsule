import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Memory Gallery - Discover Anonymous Stories from Around the World',
  description: 'Browse anonymous time capsules and memories shared by people worldwide. Discover inspiring stories, thoughts, and reflections from the global community.',
  keywords: [
    'memory gallery',
    'anonymous stories',
    'time capsule gallery',
    'shared memories',
    'public stories',
    'community memories',
    'inspiring stories',
    'human experiences'
  ],
  openGraph: {
    title: 'Memory Gallery - Discover Anonymous Stories from Around the World',
    description: 'Browse anonymous time capsules and memories shared by people worldwide. Discover inspiring stories and reflections.',
    images: ['/time_capsule.png'],
  },
  twitter: {
    title: 'Memory Gallery - Discover Anonymous Stories from Around the World',
    description: 'Browse anonymous time capsules and memories shared by people worldwide. Discover inspiring stories and reflections.',
    images: ['/time_capsule.png'],
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 