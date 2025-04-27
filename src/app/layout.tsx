import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TestPrep AI',
  description: 'Ace your exams with AI-powered test preparation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="bg-secondary text-secondary-foreground py-4 px-6 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold">TestPrep AI</Link>
          <nav>
            <ul className="flex space-x-6">
              <li><Link href="/profile">Profile</Link></li>
              <li><Link href="/score-history">Score History</Link></li>
            </ul>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

