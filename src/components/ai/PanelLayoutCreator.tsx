'use client';
import React, { useState } from 'react';
import { aiService } from '@/services/aiService';
import { getOrUpdateSeed } from "@/utils/seeds";

interface Character {
  id: string;
  name: string;
  description: string;
  role: string;
  image?: string;
}

interface Panel {
  id: string;
  characters: string[]; // Array of character IDs
  text: string;
  position: { x: number; y: number; width: number; height: number };
  generatedImage?: string;
  cameraAngle: 'wide' | 'medium' | 'closeup';
}

interface PanelLayoutCreatorProps {
  characters: Character[];
}

export default function PanelLayoutCreator({ characters }: PanelLayoutCreatorProps) {
  const [panels, setPanels] = useState<Panel[]>([]); // Explicitly define Panel type
  const [sceneDescription, setSceneDescription] = useState('');

  const generatePanelImages = async () => {
    for (const panel of panels) {
      const seed = getOrUpdateSeed(sceneDescription); // ✅ stable per scene
      const panelImage = await aiService.generatePanel({
        scene: sceneDescription,
        characters: panel.characters.map(id => characters.find(c => c.id === id) || {}),
        style: 'default',
        cameraAngle: panel.cameraAngle,
        color: 'colored',
        gradioStyle: '(None)',
        seed,
      });

      setPanels((prev) =>
        prev.map((p) => (p.id === panel.id ? { ...p, generatedImage: URL.createObjectURL(panelImage) } : p))
      );
    }
  };

  return (
    <div>
      <textarea
        value={sceneDescription}
        onChange={(e) => setSceneDescription(e.target.value)}
        placeholder="Describe the full scene..."
      />
      <button onClick={generatePanelImages}>Generate Panels</button>

      <div className="panel-grid">
        {panels.map((panel, index) => (
          <div key={index} className="panel">
            {panel.generatedImage && <img src={panel.generatedImage} alt={`Panel ${index + 1}`} />}
          </div>
        ))}
      </div>
    </div>
  );
}
