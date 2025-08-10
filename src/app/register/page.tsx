// app/register/page.tsx
import React, { Suspense } from 'react';
import { RegisterPageClient } from '../../components/Auth/RegisterPageClient';
import Head from 'next/head';

export default function RegisterPage() {
  return (
    <div>
        <Head>
  <title>Register – Mangafy.Ai</title>
  <meta
    name="description"
    content="Create an account and Log in to and start creating amazing manga panels and stories."
  />
  {/* Open Graph */}
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://mangafy-ai.vercel.app/register" />
  <meta property="og:title" content="Register – Mangafy.Ai" />
  <meta
    property="og:description"
    content="Create an account and Log in to and start creating amazing manga panels and stories."
  />
  <meta property="og:image" content="https://mangafy-ai.vercel.app/logo.png" />

  {/* Twitter */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://mangafy-ai.vercel.app/register" />
  <meta name="twitter:title" content="Register – Mangafy.Ai" />
  <meta
    name="twitter:description"
    content="Create an account and Log in to and start creating amazing manga panels and stories."
  />
  <meta name="twitter:image" content="https://mangafy-ai.vercel.app/logo.png" />
</Head>
      <h1>Register</h1>
      <Suspense fallback={<div>Loading registration form...</div>}>
        <RegisterPageClient />
      </Suspense>
    </div>
  );
}
