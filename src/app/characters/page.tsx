"use client";

import React, { useState, useEffect } from "react";
import CharacterForm from "@/components/Character/CharacterForm";
import CharacterList from "@/components/Character/CharacterList";
import "./CharactersPage.css";
import Head from 'next/head';

interface Character {
  id: string;
  name: string;
  description: string;
  role: string;
  image?: string;
  createdAt?: string; // Add this to match the expected type
}

const AIRTABLE_API_URL = `https://api.airtable.com/v0/apppD5DROHf5ImEYG/Characters`;
const AIRTABLE_TOKEN = "patZGn8fKYkL9M0pE.886619bbd975f1f2e93be680b31d973b30cff046b6eafb0760e21546a77f9acd";

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const userId = localStorage.getItem('userId'); // Get the user ID from local storage
    
        const response = await fetch(`${AIRTABLE_API_URL}?filterByFormula=({user_id}='${userId}')`, {
          headers: {
            Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          },
        });
    
        if (!response.ok) {
          throw new Error(`Failed to fetch characters: ${response.statusText}`);
        }
    
        const data = await response.json();
        setCharacters(
          data.records.map((record: any) => ({
            id: record.id,
            name: record.fields.name,
            description: record.fields.description,
            role: record.fields.role,
            image: record.fields.image?.[0]?.url || "",
          }))
        );
      } catch (error) {
        console.error("Error fetching characters:", error);
      }
    };
    fetchCharacters();
  }, []);

  const handleAddCharacter = async (newCharacter: Omit<Character, 'id'>) => {
    try {
      const userId = localStorage.getItem('userId'); // Get the user ID from local storage
  
      const payload = {
        fields: {
          name: newCharacter.name,
          description: newCharacter.description,
          role: newCharacter.role,
          image: newCharacter.image ? [{ url: newCharacter.image }] : [],
          user_id: userId, // Include the user ID
        },
      };
  
      console.log("Payload being sent to Airtable:", JSON.stringify(payload, null, 2)); // Log the payload
  
      const response = await fetch(AIRTABLE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        },
      });
  
      setCharacters(characters.filter((char) => char.id !== id));
    } catch (error) {
      console.error("Error deleting character:", error);
    }
  };

  const handleEditCharacter = (character: Character) => {
    window.location.href = `/characters/${character.id}`;
  };

  return (
    <div className="characters-page">
       <Head>
       <title>Character Creation - Mangafy.Ai</title>
  <meta
    name="description"
    content="Mangafy.Ai – Create manga panels, characters, covers, and scripts with powerful AI tools for artists, writers, and storytellers."
    lang="en"
  />

  {/* Japanese version */}
  <title lang="ja">キャラクター作成 - Mangafy.Ai</title>
  <meta
    name="description"
    content="Mangafy.Ai – AIツールで漫画のキャラクター、パネル、カバー、スクリプトを簡単に作成できます。"
    lang="ja"
  />

  {/* Open Graph */}
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://www.mangafyai.com/" />

  {/* English OG */}
  <meta property="og:title" content="Mangafy.Ai – AI Manga Creation Tools" lang="en" />
  <meta
    property="og:description"
    content="Create manga panels, characters, covers, and scripts with powerful AI tools for artists, writers, and storytellers."
    lang="en"
  />

  {/* Japanese OG */}
  <meta property="og:title" content="Mangafy.Ai – AI漫画作成ツール" lang="ja" />
  <meta
    property="og:description"
    content="AIツールを使って漫画のキャラクター、パネル、カバー、スクリプトを作成できます。"
    lang="ja"
  />
  <meta property="og:image" content="https://www.mangafyai.com/logo.png" />

  {/* Twitter */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://www.mangafyai.com/" />

  {/* English Twitter */}
  <meta name="twitter:title" content="Mangafy.Ai – AI Manga Creation Tools" lang="en" />
  <meta
    name="twitter:description"
    content="Create manga panels, characters, covers, and scripts with powerful AI tools for artists, writers, and storytellers."
    lang="en"
  />

  {/* Japanese Twitter */}
  <meta name="twitter:title" content="Mangafy.Ai – AI漫画作成ツール" lang="ja" />
  <meta
    name="twitter:description"
    content="AIツールで漫画のキャラクター、パネル、カバー、スクリプトを作成できます。"
    lang="ja"
  />
  <meta name="twitter:image" content="https://www.mangafyai.com/logo.png" />

      {/* Structured Data: Organization + Website */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Mangafy.Ai",
            url: "https://www.mangafyai.com/",
            logo: "https://www.mangafyai.com//logo.png",
            sameAs: [
              // Add your social profiles here (if any)
              "https://twitter.com/yourhandle",
              "https://facebook.com/yourpage",
              "https://instagram.com/yourprofile"
            ]
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            url: "https://www.mangafyai.com/",
            name: "Mangafy.Ai",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://www.mangafyai.com//search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }),
        }}
      />
    </Head>
      <h1>Character Creation</h1>
      <CharacterForm onSubmit={handleAddCharacter} />
      <CharacterList
        characters={characters}
        onDelete={handleDeleteCharacter}
        onEdit={handleEditCharacter}
      />
    </div>
  );
}