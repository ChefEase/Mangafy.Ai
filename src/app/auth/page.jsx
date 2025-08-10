// /app/auth/page.jsx
"use client";

import { Suspense } from "react";
import AuthCallback from "./AuthCallback";
import Head from "next/head";

<Head>
<title>Login – Mangafy.Ai</title>
<meta
  name="description"
  content="Login or sign up to Mangafy.Ai to create manga panels, characters, and scripts using AI-powered tools."
/>
<meta name="robots" content="index, follow" />
</Head>

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallback />
    </Suspense>
  );
}
