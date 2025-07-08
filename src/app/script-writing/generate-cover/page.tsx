import React from 'react';
import CoverGenerator from '@/components/ai/CoverGenerator';
import Header from '@/app/script-writing/Header';

export default function CharacterGenerationPage() {
  return (
    <div className="character-generation">
      <Header />
      <h1>AI Cover Generator</h1>
      <CoverGenerator />
    </div>
  );
}