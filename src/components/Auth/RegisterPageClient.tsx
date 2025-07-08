// src/app/register/RegisterPageClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { RegisterForm } from "./RegisterForm";

export function RegisterPageClient() {
  const searchParams = useSearchParams();
  const referrerId = searchParams?.get("ref") || null;

  return <RegisterForm referrerId={referrerId} />;
}
