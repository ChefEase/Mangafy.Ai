'use client';

import AIGenerateSection from "@/components/ai/AiGenerateSection";
import { useState } from "react";
import  "../styles/GenerationFeedback.css"; // Optional if you use extra styling
import Header from '../Header';


export default function AIGeneratePage() {
  const [generated, setGenerated] = useState<string>("");

  const handleGenerate = async (script: string) => {
    setGenerated(script);
    // Optionally store in localStorage for cross-tab usage
    localStorage.setItem("script-content", script);
  };

  return (
    <div>
        <Header/>
      <AIGenerateSection onGenerate={handleGenerate} />
    </div>
  );
}
