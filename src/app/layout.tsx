import "./globals.css";
import { Inter } from "next/font/google";
import ClientLayout from "./client-layout";

export const metadata = {
  title: "Home - Mangafy.Ai",
  description:
    "Create manga panels, characters, covers, and scripts with powerful AI tools for artists, writers, and storytellers.",
  openGraph: {
    type: "website",
    url: "https://www.mangafyai.com/",
    title: "Mangafy.Ai - AI Manga Creation Tools",
    description:
      "Create manga panels, characters, covers, and scripts with powerful AI tools for artists, writers, and storytellers.",
    images: ["https://www.mangafyai.com/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mangafy.Ai - AI Manga Creation Tools",
    description:
      "Create manga panels, characters, covers, and scripts with powerful AI tools for artists, writers, and storytellers.",
    images: ["https://www.mangafyai.com/logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
