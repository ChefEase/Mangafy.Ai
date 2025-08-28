import React from 'react';
import CharacterGenerator from '@/components/ai/CharacterGenerator';
import Header from '../Header';

export default function CharacterGenerationPage() {
  return (
    <div className="character-generation">
      <Header />
      <CharacterGenerator />
    </div>
  );
}