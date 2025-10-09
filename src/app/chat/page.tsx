'use client';

import dynamic from 'next/dynamic';
import Head from 'next/head';      // Import Head here
import MobileNav from "../../components/ScriptEditor/MobileNav"

// Dynamically import to prevent SSR issues with CSS modules
const ChatInterface = dynamic(() => import('@/components/chat/ChatInterface'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-300">Loading chat interface...</p>
      </div>
    </div>
  )
});

export default function ChatPage() {
  return (
    <>
  <Head>
        {/* English Meta */}
        <title>Ai Chat - Mangafy.Ai</title>
        <meta 
          name="description" 
          content="Chat with Mangafy.Ai to craft manga panels, characters, and story scripts using AI-powered tools for artists and writers." 
        />

        {/* Japanese Meta */}
        <meta 
          name="description" 
          lang="ja"
          content="Mangafy.Aiとチャットして、AIを使ったマンガのパネル、キャラクター、ストーリー作成を行いましょう。" 
        />
        <title lang="ja">AIチャット - Mangafy.Ai</title>

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.mangafyai.com/chat" />
        <meta property="og:title" content="Mangafy.Ai Chat – AI Manga Story Creation" />
        <meta property="og:description" content="Chat with Mangafy.Ai to create manga panels, characters, and stories using AI." />
        <meta property="og:image" content="https://www.mangafyai.com/logo.png" />

        {/* Japanese Open Graph */}
        <meta property="og:title" content="Mangafy.Aiチャット – AIマンガストーリー作成" lang="ja" />
        <meta property="og:description" content="Mangafy.Aiとチャットして、AIでマンガのパネルやキャラクター、ストーリーを作成。" lang="ja" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.mangafyai.com/chat" />
        <meta name="twitter:title" content="Mangafy.Ai Chat – AI Manga Story Creation" />
        <meta name="twitter:description" content="Chat with Mangafy.Ai to create manga panels, characters, and stories using AI." />
        <meta name="twitter:image" content="https://www.mangafyai.com/logo.png" />

        {/* Japanese Twitter */}
        <meta name="twitter:title" content="Mangafy.Aiチャット – AIマンガストーリー作成" lang="ja" />
        <meta name="twitter:description" content="Mangafy.Aiとチャットして、AIでマンガのパネルやキャラクター、ストーリーを作成。" lang="ja" />
      </Head>

    <div className="h-screen bg-gray-900">
      <ChatInterface />
    </div>
    <div>
        <MobileNav /> {/* Only visible on mobile */}
        </div>
    </>
  );
}