"use client";

import React, { useState, useEffect } from "react";
import CharacterForm from "@/components/Character/CharacterForm";
import CharacterList from "@/components/Character/CharacterList";
import "./CharactersPage.css";
import MobileNav from "../../components/ScriptEditor/MobileNav";

interface Character {
  id: string;
  name: string;
  description: string;
  role: string;
  image?: string;
  createdAt?: string;
}

const AIRTABLE_API_URL = `https://api.airtable.com/v0/apppD5DROHf5ImEYG/Characters`;
const AIRTABLE_TOKEN =
  "patZGn8fKYkL9M0pE.886619bbd975f1f2e93be680b31d973b30cff046b6eafb0760e21546a77f9acd";

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const userId = localStorage.getItem("userId");

        const response = await fetch(
          `${AIRTABLE_API_URL}?filterByFormula=({user_id}='${userId}')`,
          {
            headers: {
              Authorization: `Bearer ${AIRTABLE_TOKEN}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch characters: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Fetched data from Airtable:", data);
        setCharacters(
          (data.records || []).map((record: any) => ({
            id: record.id,
            name: record.fields?.name || "Unnamed",
            description: record.fields?.description || "No description",
            role: record.fields?.role || "supporting",
            image: record.fields?.image?.[0]?.url || "",
          }))
        );
      } catch (error) {
        console.error("Error fetching characters:", error);
      }
    };
    fetchCharacters();
  }, []);

  const handleAddCharacter = async (newCharacter: Omit<Character, "id">) => {
    try {
      const userId = localStorage.getItem("userId");

      const payload = {
        fields: {
          name: newCharacter.name,
          description: newCharacter.description,
          role: newCharacter.role,
          image: newCharacter.image ? [{ url: newCharacter.image }] : [],
          user_id: userId,
        },
      };

      console.log("Payload being sent to Airtable:", JSON.stringify(payload, null, 2));

      const response = await fetch(AIRTABLE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Airtable request failed: ${response.statusText}`);
      }

      const data = await response.json();
      setCharacters([...characters, { id: data.id, ...newCharacter }]);
    } catch (error) {
      console.error("Error adding character:", error);
    }
  };

  const handleDeleteCharacter = async (id: string) => {
    try {
      await fetch(`${AIRTABLE_API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        },
      });

      console.log("characters before filter:", characters);
      setCharacters((characters ?? []).filter((char) => char.id !== id));
    } catch (error) {
      console.error("Error deleting character:", error);
    }
  };

  const handleEditCharacter = (character: Character) => {
    window.location.href = `/characters/${character.id}`;
  };

  return (
    <div className="characters-page">
      <h1>Character Creation</h1>
      <CharacterForm onSubmit={handleAddCharacter} />
      <CharacterList
        characters={characters}
        onDelete={handleDeleteCharacter}
        onEdit={handleEditCharacter}
      />
      <div>
        <MobileNav />
      </div>
    </div>
  );
}
