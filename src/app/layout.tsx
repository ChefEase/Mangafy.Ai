"use client"; // Mark as a client component

import { useEffect } from "react"; // Import useEffect
import { Footer } from "../components/Footer/Footer";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { Inter } from 'next/font/google';
import { CreditProvider } from "@/context/CreditContext";
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Request notification permissions when the app loads
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        Notification.requestPermission()
          .then((permission) => {
            if (permission === 'granted') {
              console.log('Notification permission granted!');
            }
          })
          .catch((e) => console.error('Notification error:', e));
      }
    }
  }, []);

  return (
    
      <html className={inter.className} lang="en">
         <Head>
         <title>Home - Mangafy.Ai</title>
         <meta name="description" content="Mangafy.Ai – Create manga panels, characters, covers, and scripts with Mangafy.Ai powerful AI tools for artists, writers, and storytellers." />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mangafyai.com/" />
        <meta property="og:title" content="Manafy.Ai – AI Manga Creation Tools" />
        <meta property="og:description" content="Create manga panels, characters, covers, and scripts with powerful AI tools for artists, writers, and storytellers." />
        <meta property="og:image" content="https://www.mangafyai.com//logo.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.mangafyai.com//" />
        <meta name="twitter:title" content="Manafy.Ai – AI Manga Creation Tools" />
        <meta name="twitter:description" content="Create manga panels, characters, covers, and scripts with powerful AI tools for artists, writers, and storytellers." />
        <meta name="twitter:image" content="https://www.mangafyai.com//logo.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Comic+Sans+MS&family=Bebas+Neue&family=Impact&family=Lobster&family=Pacifico&family=Oswald&family=Bangers&family=Luckiest+Guy&family=Fredoka+One&family=Chewy&family=Indie+Flower&family=Permanent+Marker&family=Baloo+2&family=Boogaloo&family=Rubik+Wet+Paint&family=Bubblegum+Sans&family=Anton&family=Archivo+Black&family=Montserrat&family=Titillium+Web&family=Russo+One&family=Black+Ops+One&family=League+Spartan:wght@900&family=Amatic+SC&family=Satisfy&family=Great+Vibes&family=Shadows+Into+Light&family=Dancing+Script&family=Caveat&family=Gloria+Hallelujah&family=Abril+Fatface&display=swap"
          rel="stylesheet"
        />
      </Head>
        <body>
        <UserProvider>
        <CreditProvider>
            {children}
          </CreditProvider>
          </UserProvider>
          <Footer />
        </body>
      </html>
  );
}