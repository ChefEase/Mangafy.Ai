"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateScript } from "@/utils/aiService";
import { useCredits } from "@/context/CreditContext";
import "./styles/AiGenerateSection.css";

export interface AIGenerateSectionProps {
  onGenerate: (generatedScript: string) => Promise<void>;
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
      const deductionSuccess = await deductCredits(SCRIPT_COST);
      if (!deductionSuccess) throw new Error("Credit deduction failed");

      const script = await generateScript(prompt);
      await onGenerate(script);
      setGeneratedScript(script);
    } catch (error) {
      await addCredits(SCRIPT_COST);
      setError("Failed to generate script. Credits have been refunded.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    localStorage.setItem("script-content", generatedScript);
    router.push("/script-writing");
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
