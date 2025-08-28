'use client';

import dynamic from 'next/dynamic';
import Head from 'next/head';      // Import Head here

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
    <title>Ai Chat - Mangafy.Ai</title>
    <meta 
      name="description" 
      content="Chat with Mangafy.Ai to craft manga panels, characters, and story scripts using AI-powered tools for artists and writers." 
    />

    {/* Open Graph */}
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://mangafy-ai.vercel.app/chat" />
    <meta property="og:title" content="Mangafy.Ai Chat – AI Manga Story Creation" />
    <meta property="og:description" content="Chat with Mangafy.Ai to create manga panels, characters, and stories using AI." />
    <meta property="og:image" content="https://mangafy-ai.vercel.app/logo.png" />

    {/* Twitter */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://mangafy-ai.vercel.app/chat" />
    <meta name="twitter:title" content="Mangafy.Ai Chat – AI Manga Story Creation" />
    <meta name="twitter:description" content="Chat with Mangafy.Ai to create manga panels, characters, and stories using AI." />
    <meta name="twitter:image" content="https://mangafy-ai.vercel.app/logo.png" />
  </Head>

    <div className="h-screen bg-gray-900">
      <ChatInterface />
    </div>
    </>
  );
}