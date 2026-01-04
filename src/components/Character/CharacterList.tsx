"use client";

import React, { useState } from "react";
import CharacterCard from "./CharacterCard";
import CharacterSearch from "./CharacterSearch";
import "./styles/CharacterList.css";


interface Character {
  id: string;
  name: string;
  description: string;
  role: string;
  image?: string;
  createdAt?: string; // Add createdAt field
}

interface CharacterListProps {
  characters: Character[];
  onDelete: (id: string) => void;
  onEdit: (character: Character) => void;
}

export default function CharacterList({
  characters,
  onDelete,
  onEdit,
}: CharacterListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Filter and sort characters
  console.log("characters before filter:", characters);
  const filteredCharacters = (characters ?? [])
    .filter((character) => {
      const matchesSearch = character.name
        ? character.name.toLowerCase().includes(searchTerm.toLowerCase())
        : false;
      const matchesRole =
        roleFilter === "all" || character.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
    });
  return (
    <div className="character-list-container">
      {/* Search and Filtering Component */}
      <CharacterSearch
        onSearch={setSearchTerm}
        onFilterRole={setRoleFilter}
        onSort={(field, order) => {
          setSortBy(field);
          setSortOrder(order);
        }}
      />

      {/* Character Cards */}
      <div className="character-cards">
        {filteredCharacters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onDelete={() => onDelete(character.id)}
            onEdit={() => onEdit(character)}
          />
        ))}
      </div>
    </div>
  );
}