// app/reset-password/page.tsx
import React, { Suspense } from "react";
import ResetPasswordPageContent from "./ResetPasswordPageContent";
import Head from "next/head";

export default function ResetPasswordPage() {
  return (
    <>
    <Head>
    <title>Reset Password – Mangafy.Ai</title>
    <meta
      name="description"
      content="Reset your password incase you forgot it and can't log in and get back to creating panels for your manga"
    />
    {/* Open Graph */}
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.mangafyai.com//reset-password" />
    <meta property="og:title" content="Reset Password – Mangafy.Ai" />
    <meta
      property="og:description"
      content="Reset your password incase you forgot it and can't log in and get back to creating panels for your manga"
    />
    <meta property="og:image" content="https://www.mangafyai.com//logo.png" />
  
    {/* Twitter */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://www.mangafyai.com//reset-password" />
    <meta name="twitter:title" content="Reset Password – Mangafy.Ai" />
    <meta
      name="twitter:description"
      content="Reset your password incase you forgot it and can't log in and get back to creating panels for your manga"
    />
    <meta name="twitter:image" content="https://www.mangafyai.com//logo.png" />
  </Head>
    <Suspense fallback={<div>Loading reset page...</div>}>
      <ResetPasswordPageContent />
    </Suspense>
    </>
  );
}
