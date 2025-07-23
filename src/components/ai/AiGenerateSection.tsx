"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateScript } from "@/utils/aiService";
import { useCredits } from "@/context/CreditContext";
import "./styles/AiGenerateSection.css";

export interface AIGenerateSectionProps {
  onGenerate: (generatedScript: string) => Promise<void>;
}

function cleanScriptOutput(raw: string): string {
  const match = raw.match(/Panel\s*1\s*:/i);
  if (match) {
    return raw.slice(match.index!).trim();
  }
  return raw.trim(); // fallback if "Panel 1" isn't found
}

export default function AIGenerateSection({ onGenerate }: AIGenerateSectionProps) {
  const { credits, deductCredits, addCredits } = useCredits();
  const [prompt, setPrompt] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const SCRIPT_COST = 8;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description.");
      return;
    }
  
    if (credits < SCRIPT_COST) {
      setError(`You need ${SCRIPT_COST} credits to generate a script`);
      return;
    }
  
    setIsLoading(true);
    setError("");
  
    try {
      let script = await generateScript(prompt);  
      script = cleanScriptOutput(script);
      let cleanedScript = script
      .replace(/^#+\s*/gm, "")  // Remove markdown headers like ####
      .replace(/\*\*/g, "")     // Remove bold markers
      .replace(/\*/g, "")       // Remove italics/SFX stars
      .trim();            // ✅ Generate first

      cleanedScript = cleanedScript
      .split(/\n{1,}/)        // Split on one or more newlines (paragraphs)
      .map(paragraph => paragraph.trim()) // Trim each paragraph
      .filter(paragraph => paragraph.length > 0) // Remove empty paragraphs
      .join("\n\n");          // Join with double newline for paragraph spacing
  
      await onGenerate(cleanedScript);                                 // ✅ Pass to parent
      const deductionSuccess = await deductCredits(SCRIPT_COST); // ✅ Deduct only if success
      if (!deductionSuccess) throw new Error("Deduction failed"); // Just in case
      setGeneratedScript(cleanedScript);                               // ✅ Save locally
    } catch (error) {
      setError("Failed to generate script. No credits were deducted.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApply = () => {
    localStorage.setItem("script-content", generatedScript);
    setTimeout(() => {
      router.push("/script-writing?source=ai");
    }, 100);
  };

  return (
    <div className="ai-generate-section">
      <h2>AI Generate</h2>
      <textarea
        placeholder="Describe the story you want..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        onClick={handleGenerate}
        disabled={isLoading || credits < SCRIPT_COST}
      >
        {isLoading ? (
          "Generating..."
        ) : (
          <>
            Generate Script <span className="credit-cost">{SCRIPT_COST}</span>
            <img src="/credit-icon.png" alt="Credits" className="credit-icon" />
          </>
        )}
      </button>
      {credits < SCRIPT_COST && (
        <p className="error-message">
          Not enough credits. You have {credits}, need {SCRIPT_COST}.
        </p>
      )}
      {error && <p className="error-message">{error}</p>}
      {generatedScript && (
        <>
          <div dangerouslySetInnerHTML={{ __html: generatedScript }} />
          <button onClick={handleApply}>Apply to Script Box</button>
        </>
      )}
    </div>
  );
}
