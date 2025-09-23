'use client';
import ScriptWritingClient from '../../components/ScriptEditor/ScriptWritingClient';
import Head from 'next/head';
import { Suspense } from "react";

export default function Page() {
  return (
    <>
<Head>
  {/* English Meta */}
  <title>AI Manga Generate – Mangafy.Ai</title>
  <meta
    name="description"
    content="Generate stunning manga panels instantly with Mangafy.Ai's AI-powered manga generator. Bring your manga stories to life with ease and creativity."
  />

  {/* Japanese Meta */}
  <title lang="ja">AIマンガ生成 – Mangafy.Ai</title>
  <meta
    name="description"
    lang="ja"
    content="Mangafy.AiのAI搭載マンガジェネレーターで、魅力的なマンガパネルを瞬時に作成。あなたのマンガストーリーを簡単かつクリエイティブに表現できます。"
  />

  {/* Open Graph */}
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://www.mangafyai.com/script-writing" />
  <meta property="og:title" content="AI Manga Generate – Mangafy.Ai" />
  <meta
    property="og:description"
    content="Generate stunning manga panels instantly with Mangafy.Ai's AI-powered manga generator. Bring your manga stories to life with ease and creativity."
  />
  <meta property="og:title" lang="ja" content="AIマンガ生成 – Mangafy.Ai" />
  <meta
    property="og:description"
    lang="ja"
    content="Mangafy.AiのAI搭載マンガジェネレーターで、魅力的なマンガパネルを瞬時に作成。あなたのマンガストーリーを簡単かつクリエイティブに表現できます。"
  />
  <meta property="og:image" content="https://www.mangafyai.com/logo.png" />

  {/* Twitter */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://www.mangafyai.com/script-writing" />
  <meta name="twitter:title" content="AI Manga Generate – Mangafy.Ai" />
  <meta
    name="twitter:description"
    content="Generate stunning manga panels instantly with Mangafy.Ai's AI-powered manga generator. Bring your manga stories to life with ease and creativity."
  />
  <meta name="twitter:title" lang="ja" content="AIマンガ生成 – Mangafy.Ai" />
  <meta
    name="twitter:description"
    lang="ja"
    content="Mangafy.AiのAI搭載マンガジェネレーターで、魅力的なマンガパネルを瞬時に作成。あなたのマンガストーリーを簡単かつクリエイティブに表現できます。"
  />
  <meta name="twitter:image" content="https://www.mangafyai.com/logo.png" />
</Head>

  <Suspense fallback={<div>Loading script editor...</div>}>
  <ScriptWritingClient />
</Suspense>
</>
  );
}
