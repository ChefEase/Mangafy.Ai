// /app/auth/page.jsx
"use client";

import { Suspense } from "react";
import AuthCallback from "./AuthCallback";

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallback />
    </Suspense>
  );
}
