"use client"; // Mark as a client component

import { useEffect } from "react"; // Import useEffect
import { Footer } from "../components/Footer/Footer";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { Inter } from 'next/font/google';
import { CreditProvider } from "@/context/CreditContext";

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Request notification permissions when the app loads
  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Notification permission granted!');
        }
      });
    }
  }, []);

  return (
    
      <html className={inter.className} lang="en">
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