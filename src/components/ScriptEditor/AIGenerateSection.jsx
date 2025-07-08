"use client";

import React, { useState } from "react";

const AIGenerateSection = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState("");

  const handleGenerate = () => {
    onGenerate(prompt);
  };

  return (
    <div className="ai-generate-section">
      <h3>AI-Generated Script</h3>
      <textarea
        placeholder="Describe the story you want..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button onClick={handleGenerate}>Generate Script</button>
    </div>
  );
};

export default AIGenerateSection;