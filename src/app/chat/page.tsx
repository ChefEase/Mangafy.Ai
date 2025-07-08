'use client';

import dynamic from 'next/dynamic';
import Header from "../script-writing/Header";

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
    <div className="h-screen bg-gray-900">
      <Header />
      <ChatInterface />
    </div>
  );
}