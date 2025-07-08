"use client";

import React from "react";
import "./styles/CharacterCard.css";

interface Character {
  id: string;
  name: string;
  description: string;
  role: string;
  image?: string;
}

interface CharacterCardProps {
  character: Character;
  onDelete: () => void;
  onEdit: () => void;
}

export default function CharacterCard({ character, onDelete, onEdit }: CharacterCardProps) {
  return (
    <div className="character-card">
      <img src={character.image} alt={character.name} className="character-image" />
      <h3>{character.name}</h3>
      <div className="actions">
        <button onClick={onEdit}>Edit</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}