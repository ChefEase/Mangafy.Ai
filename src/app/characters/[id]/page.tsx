"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CharacterForm from "@/components/Character/CharacterForm";
import "./CharacterDetailPage.css";
import MobileNav from "@/components/ScriptEditor/MobileNav"

interface Character {
  id: string;
  name: string;
  description: string;
  role: string;
  image?: string;
}

const AIRTABLE_API_URL = `https://api.airtable.com/v0/apppD5DROHf5ImEYG/Characters`;
const AIRTABLE_TOKEN = "patZGn8fKYkL9M0pE.886619bbd975f1f2e93be680b31d973b30cff046b6eafb0760e21546a77f9acd";

export default function CharacterDetailPage() {
  const params = useParams();
  const characterId = params?.id as string;
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);

  // characters/[id]/page.tsx

useEffect(() => {
  const fetchCharacter = async () => {
    try {
      console.log("Fetching character with ID:", characterId);

      const response = await fetch(`${AIRTABLE_API_URL}/${characterId}`, {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch character: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Fetched character data:", data);

      // ✅ Normalize Airtable attachment array -> string URL
      const imageUrl =
        Array.isArray(data.fields?.image) && data.fields.image.length > 0
          ? data.fields.image[0]?.url || ""
          : "";

      const characterData: Character = {
        id: data.id,
        name: data.fields?.name || "",
        description: data.fields?.description || "",
        role: data.fields?.role || "protagonist",
        image: imageUrl,
      };

      setCharacter(characterData);
    } catch (error) {
      console.error("Error fetching character:", error);
    }
  };

  fetchCharacter();
}, [characterId]);

  const handleUpdateCharacter = async (updatedCharacter: Partial<Character>) => {
    try {
      // Prepare the basic payload
      const payload: { fields: any } = {
        fields: {
          ...(updatedCharacter.name && { name: updatedCharacter.name }),
          ...(updatedCharacter.description && { description: updatedCharacter.description }),
          ...(updatedCharacter.role && { role: updatedCharacter.role }),
        }
      };
  
      // Handle image update if a new one was provided
      if (updatedCharacter.image !== undefined) {
        payload.fields.image = updatedCharacter.image 
          ? [{ url: updatedCharacter.image }]  // Use the new Cloudinary URL
          : [];  // Clear if empty
      }
  
      console.log("Update payload:", payload);
  
      const response = await fetch(`${AIRTABLE_API_URL}/${characterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Update failed:", errorData);
        throw new Error(`Update failed: ${JSON.stringify(errorData)}`);
      }
  
      // Update local state with ALL new values including image
      setCharacter(prev => ({
        ...prev!,
        name: updatedCharacter.name || prev!.name,
        description: updatedCharacter.description || prev!.description,
        role: updatedCharacter.role || prev!.role,
        image:
      updatedCharacter.image === undefined
        ? prev?.image
        : updatedCharacter.image, // allow "" to clear
      }));
  
      alert("Character updated successfully!");
      router.push("/script-writing");
    } catch (error) {
      console.error("Update error:", error);
      alert(`Update failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  if (!character) {
    return <div>Loading...</div>;
  }

  return (
    <>
    <div className="character-detail-page">
      <h1>Edit Character</h1>
      <CharacterForm
        initialData={character}
        onSubmit={handleUpdateCharacter}
      />
    </div>
    <div>
        <MobileNav /> {/* Only visible on mobile */}
        </div>
  </>
  );
}