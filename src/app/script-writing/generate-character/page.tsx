import React from 'react';
import CharacterGenerator from '@/components/ai/CharacterGenerator';
import Header from '../Header';

export default function CharacterGenerationPage() {
  return (
    <div className="character-generation">
      <Header />
      <h1>AI Character Generator</h1>
      <CharacterGenerator />
    </div>
  );
}