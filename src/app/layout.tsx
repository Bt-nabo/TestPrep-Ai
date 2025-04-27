
'use client';

import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {useState, useEffect} from "react";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// export const metadata: Metadata = {
//   title: 'TestPrep AI',
//   description: 'Ace your exams with AI-powered test preparation.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [theme, setTheme] = useState<"light" | "dark" | "fully-black" | "monet">("monet");
  const [monetBackgroundColor, setMonetBackgroundColor] = useState<string | null>(null);

  const generateMonetColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 20) + 20; // Ensure saturation is low to make the color lighter
    const lightness = Math.floor(Math.random() * 20) + 80;   // Ensure lightness is high
    setMonetBackgroundColor(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  };

  useEffect(() => {
    document.documentElement.classList.remove("dark", "fully-black", "monet");
    setMonetBackgroundColor(null); // Reset Monet background color

    if (theme === "fully-black") {
      document.documentElement.classList.add("fully-black");
    } else if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "monet") {
      document.documentElement.classList.add("monet");
      // Generate random Monet-like color
      generateMonetColor();
    }
  }, [theme]);

  const toggleMonetTheme = () => {
    if (theme === "monet") {
      generateMonetColor(); // Regenerate color if already in monet theme
    } else {
      setTheme("monet"); // Switch to monet theme
    }
  };

  useEffect(() => {
    if (theme === "monet") {
      generateMonetColor();
    }
  }, [theme]);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="bg-secondary text-secondary-foreground py-4 px-6 flex justify-between items-center">
          <Link href="/" className="text-lg font-semibold">TestPrep AI</Link>
          <nav className="flex items-center space-x-6">
            <ul>
              <li><Link href="/profile">Profile</Link></li>
              <li><Link href="/score-history">Score History</Link></li>
            </ul>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Theme</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("fully-black")}>Fully Black</DropdownMenuItem>
                <DropdownMenuItem onClick={toggleMonetTheme}>Monet</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </header>
        <div style={{ backgroundColor: theme === 'monet' && monetBackgroundColor ? monetBackgroundColor : undefined }}>
          {children}
        </div>
      </body>
    </html>
  );
}

