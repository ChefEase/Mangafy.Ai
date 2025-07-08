'use client';
import React, { useState, useEffect } from 'react';
import { aiService, ArtStyle } from '../../services/aiService';

type GradioStyle = "(None)" | "Cinematic" | "Photographic" | "Anime" | "Manga" | "Digital Art" | "Pixel art" | "Fantasy art" | "Neonpunk" | "3D Model";
type ColorOption = "colored" | "black_white";

interface Character {
    id: string;
    name: string;
    description: string;
    role: string;
    image?: string;
  }
  
  interface AIImageGeneratorProps {
    scriptOutline: string;
    characters: Character[];
    onPanelsGenerated: (panels: string[]) => void;
    style?: ArtStyle;
    panelCount?: number; 
  }

export default function AIImageGenerator({ scriptOutline, characters, onPanelsGenerated, style, panelCount = 3, }: AIImageGeneratorProps) {
  const [scenes, setScenes] = useState<string[]>([]);
  const [generatedPanels, setGeneratedPanels] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle>("default");
  const [selectedPreset, setSelectedPreset] = useState<GradioStyle>("(None)");
  const [selectedColor, setSelectedColor] = useState<ColorOption>("black_white");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const processScript = async () => {
      const extractedScenes = await aiService.generateScenesFromOutline(scriptOutline, 3);
      setScenes(extractedScenes);
    };
    processScript();
  }, [scriptOutline]);

  const generatePanels = async () => {
    setIsGenerating(true);
    try {
      const newPanels: string[] = [];
      const panelDimensions = [
      { width: 1024, height: 512 },  // Default dimensions
      { width: 896, height: 1152 },   // Portrait
      { width: 1152, height: 896 }    // Landscape
  ];
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        const dimensions = panelDimensions[i % panelDimensions.length];
        const panelImage = await aiService.generatePanel({
          scene,
          characters,
          style: selectedStyle,
          cameraAngle: 'medium',
          width: dimensions.width,
          height: dimensions.height,
          color: selectedColor,
          gradioStyle: selectedPreset
        });

        newPanels.push(URL.createObjectURL(panelImage));
      }

      setGeneratedPanels(newPanels);
      onPanelsGenerated(newPanels);
    } catch (error) {
      console.error('Panel generation error:', error);
      alert('Failed to generate panels');
    }
    setIsGenerating(false);
  };

  const generateA4Pages = async (panels: { url: string, dimensions: { width: number, height: number } }[]) => {
    const A4_WIDTH = 2480;
    const A4_HEIGHT = 3508;
    const MARGIN = 40;
    const BORDER = 5;
    
    const pages: string[] = [];
    let currentPage: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let currentY = MARGIN;
  
    for (const panel of panels) {
      const img = await new Promise<HTMLImageElement>((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.src = panel.url;
      });
  
      // Calculate scaled dimensions
      const maxWidth = A4_WIDTH - 2*MARGIN;
      const scale = maxWidth / panel.dimensions.width;
      const scaledWidth = maxWidth;
      const scaledHeight = panel.dimensions.height * scale;
  
      if (!currentPage || currentY + scaledHeight > A4_HEIGHT - MARGIN) {
        // Create new page
        currentPage = document.createElement('canvas');
        currentPage.width = A4_WIDTH;
        currentPage.height = A4_HEIGHT;
        ctx = currentPage.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);
          // Page border
          ctx.strokeStyle = 'black';
          ctx.lineWidth = MARGIN;
          ctx.strokeRect(MARGIN/2, MARGIN/2, A4_WIDTH-MARGIN, A4_HEIGHT-MARGIN);
        }
        currentY = MARGIN;
        if (currentPage) pages.push(currentPage.toDataURL());
      }
  
      if (ctx) {
        // Draw panel
        ctx.drawImage(img, MARGIN, currentY, scaledWidth, scaledHeight);
        
        // Panel border
        ctx.strokeStyle = 'black';
        ctx.lineWidth = BORDER;
        ctx.strokeRect(MARGIN, currentY, scaledWidth, scaledHeight);
        
        currentY += scaledHeight + MARGIN;
      }
    }
  
    return pages;
  };

  const validateMonochrome = (imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      
      let isColored = false;
      for (let i = 0; i < imageData.length; i += 4) {
        if (imageData[i] !== imageData[i+1] || imageData[i+1] !== imageData[i+2]) {
          isColored = true;
          break;
        }
      }
      
      if (isColored) console.error('Color detected in generated image!');
    };
    img.src = imageUrl;
  };

  return (
    <div className= "container">
      <div className= "header">
        <h2>AI Manga Generator</h2>
        <p className= "subtitle">Transform your story into professional manga panels</p>
      </div>
      
      <div className= "controls">
        <div className= "controlGroup" >
          <label>Style Preset</label>
          <select 
            className= "select"
            value={selectedPreset} 
            onChange={(e) => setSelectedPreset(e.target.value as GradioStyle)}
          >
            {/* options */}
          </select>
        </div>
        
        <div className= "controlGroup">
          <label>Art Style</label>
          <select 
            className= "select"
            value={selectedStyle} 
            onChange={(e) => setSelectedStyle(e.target.value as ArtStyle)}
          >
            {/* options */}
          </select>
        </div>
        
        <div className= "controlGroup">
          <label>Color Option</label>
          <select 
            className= "select"
            value={selectedColor} 
            onChange={(e) => setSelectedColor(e.target.value as ColorOption)}
          >
            {/* options */}
          </select>
        </div>
        
        <button 
          className= "generateButton"
          onClick={generatePanels} 
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Manga'}
        </button>
      </div>

      {isGenerating && !generatedPanels.length && (
        <div className= "loading">
          <div className= "loadingDots">
            <div className= "dot"></div>
            <div className= "dot"></div>
            <div className="dot"></div>
          </div>
        </div>
      )}

      <div className= "panelGrid">
        {generatedPanels.map((panel, index) => (
          <div key={index} className= "panel">
            <img src={panel} alt={`Panel ${index + 1}`} />
            <div className= "panelNumber" >Panel {index + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}