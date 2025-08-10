// app/ForgotPassword/page.tsx
import React, { Suspense } from "react";
import UpdatePasswordPageContent from "./UpdatePasswordPageContext";
import Head from "next/head";  // import Head

export default function ForgotPasswordPage() {
  return (
    <>
    <Head>
    <title>Forgot Password – Mangafy.Ai</title>
    <meta
      name="description"
      content="Reset your Mangafy.Ai account password quickly and securely. Get back to creating amazing manga panels and stories."
    />
    {/* Open Graph */}
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://mangafy-ai.vercel.app/ForgotPassword" />
    <meta property="og:title" content="Forgot Password – Mangafy.Ai" />
    <meta
      property="og:description"
      content="Reset your Mangafy.Ai account password quickly and securely. Get back to creating amazing manga panels and stories."
    />
    <meta property="og:image" content="https://mangafy-ai.vercel.app/logo.png" />

    {/* Twitter */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://mangafy-ai.vercel.app/ForgotPassword" />
    <meta name="twitter:title" content="Forgot Password – Mangafy.Ai" />
    <meta
      name="twitter:description"
      content="Reset your Mangafy.Ai account password quickly and securely. Get back to creating amazing manga panels and stories."
    />
    <meta name="twitter:image" content="https://mangafy-ai.vercel.app/logo.png" />
  </Head>

    <Suspense fallback={<div>Loading forgot password...</div>}>
      <UpdatePasswordPageContent />
    </Suspense>
    </>
  );
}
