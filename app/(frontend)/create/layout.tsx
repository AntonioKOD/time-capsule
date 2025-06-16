import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Time Capsule - Seal Your Memory for the Future',
  description: 'Create a digital time capsule with photos, voice messages, and text. Choose when to open it in the future. Preserve your memories for just $1.',
  keywords: [
    'create time capsule',
    'digital memory',
    'future message',
    'photo storage',
    'voice message',
    'memory preservation',
    'digital diary',
    'future self letter'
  ],
  openGraph: {
    title: 'Create Time Capsule - Seal Your Memory for the Future',
    description: 'Create a digital time capsule with photos, voice messages, and text. Choose when to open it in the future.',
    images: ['/time_capsule.png'],
  },
  twitter: {
    title: 'Create Time Capsule - Seal Your Memory for the Future',
    description: 'Create a digital time capsule with photos, voice messages, and text. Choose when to open it in the future.',
    images: ['/time_capsule.png'],
  },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 