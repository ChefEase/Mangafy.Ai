"use client";

import { useEffect } from "react";
import { Footer } from "../components/Footer/Footer";
import { UserProvider } from "@/context/UserContext";
import { CreditProvider } from "@/context/CreditContext";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") return;
    Notification.requestPermission().catch(console.error);
  }, []);

  const pathname = usePathname() ?? "";
  const hideFooterRoutes = ["/script-writing"];
  const shouldHideFooter = hideFooterRoutes.includes(pathname);

  return (
    <UserProvider>
      <CreditProvider>{children}</CreditProvider>
      {!shouldHideFooter && <Footer />}
    </UserProvider>
  );
}
