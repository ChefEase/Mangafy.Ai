"use client";

import { useEffect } from "react";
import { Footer } from "../components/Footer/Footer";
import { UserProvider } from "@/context/UserContext";
import { CreditProvider } from "@/context/CreditContext";
import { usePathname } from "next/navigation";
import Head from "next/head";
import type { ReactNode } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission !== "granted") {
        Notification.requestPermission().catch(console.error);
      }
    }
  }, []);

  const pathname = usePathname() ?? "";
  const hideFooterRoutes = ["/script-writing"];
  const shouldHideFooter = hideFooterRoutes.includes(pathname);

  return (
    <>
      <Head>
        <title>Home - Mangafy.Ai</title>
        <meta
          name="description"
          content="Mangafy.Ai – Create manga panels, characters, covers, and scripts."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <UserProvider>
        <CreditProvider>{children}</CreditProvider>
      </UserProvider>

      {!shouldHideFooter && <Footer />}
    </>
  );
}
