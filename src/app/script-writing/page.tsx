'use client';
import ScriptWritingClient from '../../components/ScriptEditor/ScriptWritingClient';
import Head from 'next/head';
import { Suspense } from "react";

export default function Page() {
  return (
    <>
  <Head>
  <title>AI Manga Generate – Mangafy.Ai</title>
  <meta
    name="description"
    content="Generate stunning manga panels instantly with Mangafy.Ai's AI-powered manga generator. Bring your manga stories to life with ease and creativity."
  />
  {/* Open Graph */}
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://www.mangafyai.com//script-writing" />
  <meta property="og:title" content="AI Manga Generate – Mangafy.Ai" />
  <meta
    property="og:description"
    content="Generate stunning manga panels instantly with Mangafy.Ai's AI-powered manga generator. Bring your manga stories to life with ease and creativity."
  />
  <meta property="og:image" content="https://www.mangafyai.com//logo.png" />

  {/* Twitter */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://www.mangafyai.com//script-writing" />
  <meta name="twitter:title" content="AI Manga Generate – Mangafy.Ai" />
  <meta
    name="twitter:description"
    content="Generate stunning manga panels instantly with Mangafy.Ai's AI-powered manga generator. Bring your manga stories to life with ease and creativity."
  />
  <meta name="twitter:image" content="https://www.mangafyai.com//logo.png" />
</Head>
  <Suspense fallback={<div>Loading script editor...</div>}>
  <ScriptWritingClient />
</Suspense>
</>
  );
}
