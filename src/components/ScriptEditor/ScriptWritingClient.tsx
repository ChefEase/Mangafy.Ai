'use client';
import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../app/script-writing/Header";
import { usePathname, useRouter } from "next/navigation";
import { autoSave, loadSavedContent } from "../../utils/autoSave";
import { validateScript } from "../../utils/scriptValidation";
import ScriptEditorWrapper from "../ScriptEditorWrapper/ScriptEditorWrapper";
import AIGenerateSection from "../ai/AiGenerateSection";
import { aiService, ArtStyle } from "../../services/aiService";
import  '../../app/script-writing/styles/GenerationFeedback.css'
import '../../app/script-writing/styles/MangaPage.css'
import '../../app/script-writing/styles/ArtStyleDropDown.css'
import styles from '../../app/script-writing/styles/AIImageGenerator.module.css';
import LZString from 'lz-string'
import { useUser } from "@/context/UserContext";
import supabase from "@/utils/supabaseClient";
import { useCredits } from "@/context/CreditContext";
import { CharacterService, Character } from "@/services/CharacterService";
import  CharactersPage  from "../../app/characters/page";

  interface PanelData {
    url: string;
    dimensions: { width: number; height: number };
    dialogue?: string  ;
    image?: HTMLImageElement; // ✅ Add this
  }
  
  interface StyleSelectorProps {
    selectedStyle: ArtStyle;
    onChange: (style: ArtStyle) => void;
  }

  interface AIGenerateSectionProps {
    onGenerate: (generatedScript: string) => Promise<void>;
  }
  
  type PanelType = 
  | 'one-portrait' 
  | 'two-vertical' 
  | 'two-horizontal' 
  | 'three-default' 
  | 'three-vertical-horizontal' 
  | 'three-horizontal-vertical';

  interface PanelConfig {
    panelCount: number;
    layout: (panels: PanelData[], ctx: CanvasRenderingContext2D, A4_WIDTH: number, A4_HEIGHT: number) => void;
  }

  type ColorOption = "black_white" | "colored";
type GradioStyle = "Cinematic" | "Photographic" | "Anime" | "Manga" | "Digital Art" | "Pixel art" | "Fantasy art" | "Neonpunk" | "3D Model";

const PANEL_CONFIG: Record<PanelType, PanelConfig> = {
  'one-portrait': {
    panelCount: 1,
    layout: (panels, ctx, A4_WIDTH, A4_HEIGHT) => {
      panels.forEach((panel) => {
      if (typeof window === 'undefined') return;
      const margin = 140;
      const border = 12;

      ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

  const img = panel.image;
  if (!img) return;

      const maxWidth = A4_WIDTH - margin * 2;
      const maxHeight = A4_HEIGHT - margin * 2;
      const scale = Math.min(
        maxWidth / panels[0].dimensions.width ,
        maxHeight / panels[0].dimensions.height
      );

      const scaledWidth = panels[0].dimensions.width * scale;
      const scaledHeight = panels[0].dimensions.height * scale;
      const x = (A4_WIDTH - scaledWidth) / 2;
      const y = (A4_HEIGHT - scaledHeight) / 2;

      // Border and image drawing
      ctx.fillStyle = 'black';
      ctx.fillRect(x - border, y - border, scaledWidth + border*2, scaledHeight + border*2);
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      if (panels[0].dialogue) {
        const bubbleX = x + 50;
        const bubbleY = y + scaledHeight - 150;
        addDialogueBubble(ctx, panels[0].dialogue, bubbleX, bubbleY);
      }
      if (panels.length !== 1) {
        console.error('Single panel layout received wrong number of panels:', panels.length);
        return;
      }
    });
    }
  },
  'two-vertical': {
panelCount: 2,
layout: (panels, ctx, A4_WIDTH, A4_HEIGHT) => {
  if (typeof window === 'undefined') return;
  const MARGIN = 140;
  const BORDER = 12;
  const panelWidth = (A4_WIDTH - MARGIN * 3) / 2;
  const maxHeight = A4_HEIGHT - MARGIN * 2;

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

  panels.forEach((panel, index) => {
    const img = panel.image;
    if (!img) return;
    
    const scale = Math.min(
      panelWidth / panel.dimensions.width ,
      maxHeight / panel.dimensions.height
    );
    
    const scaledWidth = panels[0].dimensions.width * scale;
    const scaledHeight = panels[0].dimensions.height * scale;
     
    const x = MARGIN + (panelWidth + MARGIN) * index;
    const y = MARGIN + (A4_HEIGHT - scaledHeight) / 2;
    // Draw border
    ctx.fillStyle = 'black';
    ctx.fillRect(
      x - BORDER,
      y - BORDER,
      scaledWidth + BORDER*2,
      scaledHeight + BORDER*2
    );
    
    // Draw image
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    if (panel.dialogue) {
      const bubbleX = x + 50;
      const bubbleY = y + scaledHeight - 150;
      addDialogueBubble(ctx, panel.dialogue, bubbleX, bubbleY);
    }
  });
}
},
  'two-horizontal': {
panelCount: 2,
layout: (panels, ctx, A4_WIDTH, A4_HEIGHT) => {
  if (typeof window === 'undefined') return;
  const MARGIN = 140;
  const BORDER = 12;
  const PANEL_WIDTH = A4_WIDTH - MARGIN * 2;
  const PANEL_HEIGHT = (A4_HEIGHT - MARGIN * 3) / 2;

  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

  panels.forEach((panel, index) => {
    const y = MARGIN + (PANEL_HEIGHT + MARGIN) * index;
    const img = panel.image;
    if (!img) return;

    // Draw border
    ctx.fillStyle = 'black';
    ctx.fillRect(
      MARGIN - BORDER,
      y - BORDER,
      PANEL_WIDTH + BORDER * 2,
      PANEL_HEIGHT + BORDER * 2
    );

    // Calculate scaling
    const scale = Math.min(
      PANEL_WIDTH / panel.dimensions.width,
      PANEL_HEIGHT / panel.dimensions.height
    );
    const scaledWidth = panel.dimensions.width * scale;
    const scaledHeight = panel.dimensions.height * scale;
    
    // Center image in panel
    const xOffset = MARGIN + (PANEL_WIDTH - scaledWidth) / 2;
    const yOffset = y + (PANEL_HEIGHT - scaledHeight) / 2;

    ctx.drawImage(img, xOffset, yOffset, scaledWidth, scaledHeight);
    if (panel.dialogue) {
      const bubbleX = xOffset + 50;
      const bubbleY = yOffset + scaledHeight - 150;
      addDialogueBubble(ctx, panel.dialogue, bubbleX, bubbleY);
    }
  });
}
},

  'three-default': {
    panelCount: 3,
    layout: (panels, ctx, A4_WIDTH, A4_HEIGHT) => {
      if (typeof window === 'undefined') return;
      const margin = 140;
      const border = 12;
      const PANEL_WIDTH = 2200; // (2480 - 40*2)
      const PANEL_HEIGHT = 1009; // (3508 - 40*4) / 3 → 3348/3=1116 → floor to 1112

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

      panels.forEach((panel, index) => {
        const y = margin + (PANEL_HEIGHT + margin) * index;
        const img = panel.image;
        if (!img) return;

        ctx.fillStyle = 'white';
        ctx.fillRect(margin, y, PANEL_WIDTH, PANEL_HEIGHT);
        
        // Calculate scaling
        const scale = Math.min(
          PANEL_WIDTH / panel.dimensions.width,
          PANEL_HEIGHT / panel.dimensions.height
        );
        const scaledWidth = panel.dimensions.width * scale;
        const scaledHeight = panel.dimensions.height * scale;

        const xOffset = margin + (PANEL_WIDTH - scaledWidth) / 2;
        const yOffset = y + (PANEL_HEIGHT - scaledHeight) / 2;

        ctx.fillStyle = 'black';
        ctx.fillRect(
          margin - border,
          y - border,
          PANEL_WIDTH + border * 2,
          PANEL_HEIGHT + border * 2
        );

      ctx.drawImage(img, xOffset, yOffset, scaledWidth, scaledHeight);
        // Border and image
        if (panel.dialogue) {
          const bubbleX = xOffset + 50;
          const bubbleY = yOffset + scaledHeight - 150;
          addDialogueBubble(ctx, panel.dialogue, bubbleX, bubbleY);
        }
      });
    }
  },
  'three-vertical-horizontal': {
panelCount: 3,
layout: (panels, ctx, A4_WIDTH, A4_HEIGHT) => {
  if (typeof window === 'undefined') return;
  const margin = 140;
  const border = 12;
  const panelSpacing = 30;

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

  const maxTopPanelWidth = (A4_WIDTH - margin * 2 - panelSpacing) / 2;
  let tallestTopPanelHeight = 0;

  // 🟦 Top two vertical panels
  panels.slice(0, 2).forEach((panel, index) => {
    const img = panel.image;
    if (!img) return;

    const scale = Math.min(
      maxTopPanelWidth / panel.dimensions.width,
      (A4_HEIGHT * 0.5) / panel.dimensions.height // Just use 50% cap
    );

    const scaledWidth = panel.dimensions.width * scale;
    const scaledHeight = panel.dimensions.height * scale;

    if (scaledHeight > tallestTopPanelHeight) {
      tallestTopPanelHeight = scaledHeight;
    }

    const x = margin + (maxTopPanelWidth + panelSpacing) * index + (maxTopPanelWidth - scaledWidth) / 2;
    const y = margin;

    ctx.fillStyle = 'black';
    ctx.fillRect(x - border, y - border, scaledWidth + border * 2, scaledHeight + border * 2);
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
  });

  // 🟥 Bottom horizontal panel
  panels.forEach((panel) => {
  const bottomPanel = panels[2];
  const img = panel.image;
  if (!img) return;
  img.src = bottomPanel.url;

  const BOTTOM_WIDTH = A4_WIDTH * 0.9;
  const BOTTOM_HEIGHT = A4_HEIGHT * 0.5;

  const scale = Math.min(
    BOTTOM_WIDTH / img.width,
    BOTTOM_HEIGHT / img.height
  );

  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;

  const x = margin + (BOTTOM_WIDTH - scaledWidth) / 2;
  const y = margin + tallestTopPanelHeight + panelSpacing + border * 2; // ✅ True spacing based on top

  ctx.fillStyle = 'black';
  ctx.fillRect(x - border, y - border, scaledWidth + border * 2, scaledHeight + border * 2);
  ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
});
}
},

  'three-horizontal-vertical': {
    panelCount: 3,
    layout: (panels, ctx, A4_WIDTH, A4_HEIGHT) => {
      if (typeof window === 'undefined') return;
      const margin = 140;
      const border = 12;
      const panelSpacing = 40;
      const topHeight = (A4_HEIGHT - margin*2 - panelSpacing) * 0.6;
      const bottomHeight = (A4_HEIGHT - margin*2 - panelSpacing) * 0.4;

      // Top horizontal panel
      const topPanel = panels[0];
       const imgTop = typeof window !== 'undefined' ? new Image() : null;
    if (!imgTop) return;
      imgTop.src = topPanel.url;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);
      
      const maxWidth = A4_WIDTH - margin*2;
      const scale = Math.min(
        maxWidth / imgTop.width,
        topHeight / imgTop.height
      );
      
      const scaledWidth = imgTop.width * scale;
      const scaledHeight = imgTop.height * scale;
      const x = margin + (maxWidth - scaledWidth)/2;
      const y = margin + (topHeight - scaledHeight)/2;

      ctx.fillStyle = 'black';
      ctx.fillRect(x - border, y - border, scaledWidth + border*2, scaledHeight + border*2);
      ctx.drawImage(imgTop, x, y, scaledWidth, scaledHeight);
 if (topPanel.dialogue) {
          const bubbleX = x + 50;
          const bubbleY = y + scaledHeight - 150;
          
          // Speech bubble background
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(bubbleX, bubbleY, 300, 80, 10);
          ctx.fill();
          ctx.stroke();
  
          // Dialogue text
          ctx.fillStyle = 'black';
          ctx.font = '24px sans-serif';
          ctx.textAlign = 'left';
          wrapText(ctx, topPanel.dialogue, bubbleX + 15, bubbleY + 30, 270, 28);
        }
      // Bottom two vertical panels
      panels.slice(1).forEach((panel, index) => {
        const img = panel.image;
        if (!img) return;
        
        const maxWidth = (A4_WIDTH - margin*2 - panelSpacing) / 2;
        const scale = Math.min(
          maxWidth / panel.dimensions.width,
          bottomHeight / panel.dimensions.height
        );
        
        const scaledWidth = panel.dimensions.width  * scale;
        const scaledHeight = panel.dimensions.height  * scale;
        const panelX = margin + (maxWidth + panelSpacing) * index + (maxWidth - scaledWidth)/2;
        const panelY = margin + topHeight + panelSpacing + (bottomHeight - scaledHeight) / 2;
        ctx.fillStyle = 'black';
        ctx.fillRect(panelX - border, panelY - border, scaledWidth + border*2, scaledHeight + border*2);
        ctx.drawImage(img, panelX, panelY, scaledWidth, scaledHeight);
        if (panel.dialogue) {
          const bubbleX = x + 50;
          const bubbleY = y + scaledHeight - 150;
          
          // Speech bubble background
          ctx.fillStyle = 'white';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(bubbleX, bubbleY, 300, 80, 10);
          ctx.fill();
          ctx.stroke();
  
          // Dialogue text
          ctx.fillStyle = 'black';
          ctx.font = '24px sans-serif';
          ctx.textAlign = 'left';
          wrapText(ctx, panel.dialogue, bubbleX + 15, bubbleY + 30, 270, 28);
        }
      });
    }
  }
};

  function addDialogueBubble(
    ctx: CanvasRenderingContext2D,
    dialogue: string,
    x: number,
    y: number
  ) {
    // Speech bubble background
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, 300, 80, 10);
    ctx.fill();
    ctx.stroke();
  
    // Dialogue text
    ctx.fillStyle = 'black';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'left';
    wrapText(ctx, dialogue, x + 15, y + 30, 270, 28);
  }

  function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
  
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = context.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        context.fillText(line, x, y);
        line = word + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);
  }

  export default function ScriptWritingPage() {
    const [content, setContent] = useState("");
    const [errors, setErrors] = useState<string[]>([]);
    const pathname = usePathname(); // Get the current route
    const [isCharactersPageOpen, setIsCharactersPageOpen] = useState(false); // Toggle for characters panel
    // Change the characters state line to:
    const [characters, setCharacters] = useState<Character[]>([]);
    const [charactersPageWidth, setCharactersPageWidth] = useState(250); // Default width for characters panel
    const [isGenerating, setIsGenerating] = useState(false); // Handle AI generation state
    const [generatedPanels, setGeneratedPanels] = useState<string[]>([]);
    const [selectedStyle, setSelectedStyle] = useState<ArtStyle>("default");
    const [selectedPanelType, setSelectedPanelType] = useState<PanelType>('three-default');
    const [panelCount, setPanelCount] = useState(3);
    const [zoomedPage, setZoomedPage] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const router = useRouter();
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<GradioStyle>('Manga');
const [selectedColor, setSelectedColor] = useState<ColorOption>('black_white');
const { credits, deductCredits } = useCredits();
const { user } = useUser();

let generateA4Pages: (panels: PanelData[]) => Promise<string[]> = async () => [];
if (typeof window !== 'undefined') {
    generateA4Pages = async (panels: PanelData[]): Promise<string[]> => {
      const A4_WIDTH = 2480;
      const A4_HEIGHT = 3508;
      const pages: string[] = [];

      const canvas = document.createElement('canvas');
      canvas.width = A4_WIDTH;
      canvas.height = A4_HEIGHT;
      const ctx = canvas.getContext('2d')!;
      // Load all images first
      const loadedPanels = await Promise.all(
        panels.map(async (panel) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = panel.url;
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = (e) => {
              console.error('Image load error:', panel.url, e);
              reject(new Error("Image failed to load"));
            }
          });
      
          return {
            ...panel,
            image: img, // ✅ attach loaded image
          };
        })
      );
    
      // Apply selected layout
      PANEL_CONFIG[selectedPanelType].layout(
        loadedPanels,
        ctx,
        A4_WIDTH,
        A4_HEIGHT
      );
    
      pages.push(canvas.toDataURL('image/png'));
      return pages;
    };
}  
    useEffect(() => {
      console.log("Building ScriptWritingClient"); // top of file
      console.log("Document is", typeof document); // should error if run on server

      if (!user?.id) return;
      if (canvasRef.current) {
        canvasRef.current.width = 2480;
        canvasRef.current.height = 3508;
      }
      const params = new URLSearchParams(window.location.search);
      const fromAI = params.get("source") === "ai";

      const savedScript = localStorage.getItem("saved-script");
      const selectedTemplate = localStorage.getItem("script-content");
      // Fix: Ensure setContent always receives a string, never null
      console.log("selectedTemplate", selectedTemplate);
console.log("savedScript", savedScript);
const initialContent = fromAI && selectedTemplate
? selectedTemplate
: savedScript || "";
      setContent(initialContent);
      console.log("Loaded initial script content:", initialContent);

      const loadCharacters = async () => {
        try {
          const chars = await CharacterService.getCharacters();
          setCharacters(chars);
          console.log("Loaded characters:", chars);
        } catch (error) {
          console.error("Failed to load characters:", error);
        }
      };
      loadCharacters();
    }, []);
    
    const handleSave = () => {
      const validationErrors = validateScript(content);
      setErrors(validationErrors);
      if (validationErrors.length === 0) {
        autoSave("script-content", content);
        console.log("Script saved successfully!");
      }
    };
  
    const handleGenerateScript = async (generatedScript: string) => {
      setContent(generatedScript); // Update the editor with the generated script
    };
  
    const toggleCharactersPage = () => {
      setIsCharactersPageOpen(!isCharactersPageOpen);
    };
  
    const handleResizeCharactersPage = (newWidth: number) => {
      setCharactersPageWidth(newWidth);
    };
  
    const processScriptContent = (script: string, characters: Character[]): string => {
      // Add strict character validation
      const missingChars = characters.filter(c => !script.includes(c.name));
      if (missingChars.length > 0) {
        console.warn("Characters not in script:", missingChars);
      }
    
      // Enhanced replacement
      return characters.reduce((processedScript, character) => {
        const regex = new RegExp(`\\b${character.name}\\b`, 'gi');
        return processedScript.replace(regex, character.description);
      }, script.replace(/<[^>]*>?/gm, ''));
    };
  
    // Add updateCreditsInBackend function
const updateCreditsInBackend = async (newCredits: number) => {
  if (!user?.id) return;
  try {
    await supabase
      .from('users')
      .update({ credits: newCredits })
      .eq('id', user.id);
    localStorage.setItem(`user-${user.id}-credits`, newCredits.toString());
  } catch (error) {
    console.error('Failed to update credits:', error);
  }
};

    const handleGenerateManga = async () => {
      if (typeof window === 'undefined') return;
      const cost = getCostForPanelType(selectedPanelType);
      const config = PANEL_CONFIG[selectedPanelType];
      const MAX_PANELS = config.panelCount;
      setGenerationProgress({
        current: 0,
        total: 0,
        status: 'Initializing...'
      });
      if (credits < cost) {
        alert(`Not enough credits! You need ${cost} credits but only have ${credits}.`);
        return;
      }
  
      try {
    
        setGenerationProgress({ current: 0, total: 0, status: 'Processing script...' });
  
        const latestCharacters = await CharacterService.getCharacters();
        
        // Generate initial panels with character names
        setGenerationProgress(p => ({...p, status: 'Generating panel scripts...'}));
        const plainOutline = content.replace(/<[^>]*>?/gm, '').trim();
        console.log("Cleaned Outline:", plainOutline);
        if (!plainOutline) {
          alert("Your script is empty. Please write something before generating scenes.");
          return;
        }
        const rawPanels = await aiService.generateScenesFromOutline(plainOutline, panelCount);
        const limitedPanels = rawPanels.slice(0, MAX_PANELS);
        console.log("Limited Panels:", limitedPanels); // Debug log
  
        if (!limitedPanels || limitedPanels.length === 0) {
          throw new Error("No panels generated - check AI response");
        }
  
        
      if (limitedPanels.some((panel: string | string[]) => panel.includes("undefined"))) {
        console.warn("Undefined values detected in:", limitedPanels);
        throw new Error("AI generated incomplete panels - try regenerating");
      }
      if (panelCount !== PANEL_CONFIG[selectedPanelType].panelCount) {
        throw new Error(`Panel count mismatch! UI: ${panelCount}, Config: ${PANEL_CONFIG[selectedPanelType].panelCount}`);
      }
      
      // Add this validation before generating
      if (panelCount === 1 && selectedPanelType !== 'one-portrait') {
        throw new Error('Invalid panel selection for single page');
      }
  
        setGenerationProgress(p => ({...p, total: limitedPanels.length}));
        // Replace names with descriptions
        const processedPanels = limitedPanels.map((panel: string, index: number) => {
          setGenerationProgress(p => ({
            current: index + 1,
            total: limitedPanels.length,
            status: `Processing panel ${index + 1}/${limitedPanels.length}`
          }));
          const dialogue = panel.match(/Dialogue:\s*"([^"]+)"/)?.[1] || '';
          const scene = CharacterService.replaceNamesWithDescriptions(panel, latestCharacters);
          return { 
            scene,
            dialogue,
             cameraAngle: panel.match(/\(Camera:\s*(.+?)\)/)?.[1] || 'medium'
          };
        });

        // Log processed panels to console
        console.log("Processed Panels with Descriptions:", processedPanels);
    
        // Generate images with proper dimensions
        const newPanels = [];
          for (let i = 0; i < processedPanels.length; i++) {
            setGenerationProgress({
              current: i + 1,
              total: processedPanels.length,
              status: `Generating image ${i + 1}/${processedPanels.length}`
            });
            const dimensions = getPanelDimensions(i);
            const panelData = processedPanels[i];
            const panelImage = await aiService.generatePanel({
              scene: panelData.scene,
              characters: characters.filter(c => c.image),
              style: selectedStyle,
              cameraAngle: panelData.cameraAngle,
              width: dimensions.width,
              height: dimensions.height,
              color: selectedColor, // ✅ Fix: Include this
              gradioStyle: selectedPreset, // ✅ Also needed if using Gradio
            });

            if (!(panelImage instanceof Blob)) {
              console.error("Panel image is not a blob!", panelImage);
              throw new Error("Invalid panel image format");
            }
            
            if (!panelImage || panelImage.size < 1000) {
              throw new Error("Empty or corrupted image blob");
            }
            
            newPanels.push({
              url: URL.createObjectURL(panelImage),
              dimensions,
              dialogue: panelData.dialogue
            });
            console.log("Panel Dimensions:", dimensions);
          }
    
        // Generate A4 pages
          // ADD THIS VALIDATION
          if (newPanels.length === 0) {
            throw new Error("No panels were generated successfully");
        }
        setGenerationProgress(p => ({...p, status: 'Arranging pages...'}));
        const pages = await generateA4Pages(newPanels);
        console.log('Generated pages:', pages.length);
        if (pages.length === 0) {
            throw new Error("Page generation returned empty array");
        }
        setGeneratedPanels(pages);
        const deductionSuccess = await deductCredits(cost);
        if (!deductionSuccess) {
          alert("Something went wrong updating credits. Please refresh the page.");
        }
        if (!pages || pages.length === 0) {
          throw new Error("Image generation failed — no pages created.");
        }
        setGenerationProgress({ current: 0, total: 0, status: 'Complete!' });
      } catch (error) {
         // Return credits if generation fails
    
        console.error('Generation error:', error);
        setGenerationProgress({
          current: 0,
          total: 0,
          status: `Error: ${error}`
        });
      } finally {
        setIsGenerating(false);
      }
    };
    
    const getPanelDimensions = (index: number) => {
      const margin = 140;
      const BASE_WIDTH = 2480 - margin * 2;
      const pageHeight = 3508;
      const panelHeight = (pageHeight - margin * 3) / 2; // 3508-120=3388/2=1694
      // Ensure dimensions are divisible by 8
      const makeDivisible = (num: number) => Math.floor(num - (num % 8));
    
      switch(selectedPanelType) {
        case 'one-portrait':
          return {
            width: makeDivisible(2200),  // Portrait width
            height: makeDivisible(3224)  // Portrait height (1.5:1 aspect ratio)
          };
        case 'two-vertical': // Vertical aspect ratio
          return {
            width: makeDivisible(1008), // Half width for two vertical panels
            height: makeDivisible(3224)   // Full height
          };
         
        case 'two-horizontal':
          return {
            width: BASE_WIDTH - (BASE_WIDTH % 8),  // 2400-0=2400 (2400 ÷ 8 = 300)
            height: panelHeight - (panelHeight % 8) // 1694-6=1688 (1688 ÷ 8 = 211) 
          };
        // Add other cases
        default: // three-default
        return {
          width: 2200, // 2480 - 40*2 = 2400 (divisible by 8)
          height: 982 // (3508 - 160) / 3 = 1116 → floor to 1112 (1112 ÷ 8 = 139)
        };

        case 'three-horizontal-vertical':
          return index === 0 
            ? { width: 2480 - margin*2, height: 1614 } // Horizontal
            : { width: 1630, height: 2014 };          // Vertical
    
        case 'three-vertical-horizontal':
          return index === 2 
            ? { width: 2480 - margin*2, height: 1614 } // Horizontal 
            : { width: 1630, height: 2014 };          // Vertical
      }
    };
  
    const [generationProgress, setGenerationProgress] = useState({
      current: 0,
      total: 0,
      status: ''
    });
  
    const downloadAllPages = () => {
      if (typeof document === "undefined") return;
      generatedPanels.forEach((pageData, index) => {
        const link = document.createElement('a');
        link.href = pageData;
        link.download = `manga_page_${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (index === 0) {
          sessionStorage.setItem('templateImage', LZString.compressToUTF16(pageData));
        }
      });
    };
    const ColorOptionSelector = ({ 
      selectedColor,
      onChange 
    }: {
      selectedColor: ColorOption;
      onChange: (color: ColorOption) => void;
    }) => (
      <div className={styles.controlGroup}>
        <label>Color Option:</label>
        <select
          value={selectedColor}
          onChange={(e) => onChange(e.target.value as ColorOption)}
          className={styles.select}
        >
          <option value="black_white">Black and White</option>
          <option value="colored">Full Color</option>
        </select>
      </div>
    );
    
const AnimeStyleSelector = ({ selectedStyle, onChange }: StyleSelectorProps) => (
  <div className={styles.controlGroup}>
    <label>Art Style:</label>
    <select 
      value={selectedStyle} 
      onChange={(e) => onChange(e.target.value as ArtStyle)}
      className={styles.select}
    >
      <option value="default">Default Manga</option>
      <option value="one-piece">One Piece (Eiichiro Oda)</option>
      <option value="jujutsu-kaisen">Jujutsu Kaisen (Gege Akutami)</option>
      <option value="my-hero-academia">My Hero Academia (Kohei Horikoshi)</option>
      <option value="dandadaan">Dandadan (Yukinobu Tatsu)</option>
      <option value="quintessential-quintuplets">Quintessential Quintuplets (Negi Haruba)</option>
      <option value="tokyo-revengers">Tokyo Revengers (Ken Wakui)</option>
    </select>
  </div>
);

const PanelTypeSelector = ({ 
  selectedType,
  onChange 
}: {
  selectedType: PanelType;
  onChange: (type: PanelType) => void;
}) => (
  <div className={styles.controlGroup}>
    <label>Panel Layout:</label>
    <select
      value={selectedType}
      onChange={(e) => onChange(e.target.value as PanelType)}
      className={styles.select}
    >
      <option value="one-portrait">Single Portrait</option>
      <option value="two-vertical">Two Vertical</option>
      <option value="two-horizontal">Two Horizontal</option>
      <option value="three-default">Three Horizontal (Default)</option>
      <option value="three-vertical-horizontal">Three (2 Vertical + 1 Horizontal)</option>
      <option value="three-horizontal-vertical">Three (1 Horizontal + 2 Vertical)</option>
    </select>
  </div>
);

const StylePresetSelector = ({ 
  selectedPreset,
  onChange 
}: {
  selectedPreset: GradioStyle;
  onChange: (preset: GradioStyle) => void;
}) => (
  <div className={styles.controlGroup}>
    <label>Style Preset:</label>
    <select
      value={selectedPreset}
      onChange={(e) => onChange(e.target.value as GradioStyle)}
      className={styles.select}
    >
      <option value="Cinematic">Cinematic</option>
      <option value="Photographic">Photographic</option>
      <option value="Anime">Anime</option>
      <option value="Manga">Manga</option>
      <option value="Digital Art">Digital Art</option>
      <option value="Pixel art">Pixel Art</option>
      <option value="Fantasy art">Fantasy Art</option>
      <option value="Neonpunk">Neonpunk</option>
      <option value="3D Model">3D Model</option>
    </select>
  </div>
);

// Add getCostForPanelType function
const getCostForPanelType = (panelType: PanelType): number => {
  switch(panelType) {
    case 'one-portrait': return 12;
    case 'two-vertical': 
    case 'two-horizontal': return 22;
    default: return 30; // All three-panel layouts
  }
};

// Add CreditIcon component
const CreditIcon = ({ cost }: { cost: number }) => (
  <div className={styles.creditBadge}>
    <img src="/credit-icon.png" alt="Credits" className={styles.creditIcon} />
    <span className={styles.creditCost}>{cost}</span>
  </div>
);

    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.header}>
      <h2>Manga Creator Studio</h2>
      <p className={styles.subtitle}>Transform your script into professional manga panels</p>
    </div>
        <div className="script-writing-page">
          {/* Characters Page Sidebar */}
          <div
            className={`characters-sidebar ${isCharactersPageOpen ? "open" : "closed"}`}
            style={{ width: isCharactersPageOpen ? charactersPageWidth : 0 }}
          >
            <CharactersPage />
            <div
              className="resize-handle"
              onMouseDown={(e) => {
                if (typeof window === "undefined") return;
                e.preventDefault();
                const startWidth = charactersPageWidth;
                const startX = e.clientX;
  
                const handleMouseMove = (e: MouseEvent) => {
                  const newWidth = startWidth + (e.clientX - startX);
                  setCharactersPageWidth(Math.max(400, Math.min(800, newWidth))); // Limit width between 200px and 500px
                };
  
                const handleMouseUp = () => {
                  if (typeof window === "undefined") return;
                  document.removeEventListener("mousemove", handleMouseMove);
                  if (typeof window === "undefined") return;
                  document.removeEventListener("mouseup", handleMouseUp);
                };
  
                if (typeof window === "undefined") return;
                document.addEventListener("mousemove", handleMouseMove);
                if (typeof window === "undefined") return;
                document.addEventListener("mouseup", handleMouseUp);
              }}
            />
            <button className="toggle-button" onClick={toggleCharactersPage}>
              {isCharactersPageOpen ? "◄" : "►"}
            </button>
          </div>
  
          {/* Script Editor */}
          <div className="script-editor-container">
            <h2>Script Box</h2>
            {errors.length > 0 && (
              <div className="error-message">
                {errors.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}
            <ScriptEditorWrapper
              content={content}
              onContentChange={setContent}
              onSave={handleSave}
              initialContent={content}
            />
    <div className={styles.controls}>
      <StylePresetSelector
        selectedPreset={selectedPreset}
        onChange={setSelectedPreset}
      />
      <AnimeStyleSelector
    selectedStyle={selectedStyle}
    onChange={(style: ArtStyle) => setSelectedStyle(style)}
  />
   <PanelTypeSelector 
        selectedType={selectedPanelType}
        onChange={(type) => {
          setSelectedPanelType(type);
          setPanelCount(PANEL_CONFIG[type].panelCount);
        }}
      />
      
      <ColorOptionSelector
        selectedColor={selectedColor}
        onChange={setSelectedColor}
      />
      <h2>Click on the preview page to see how it appears once downloaded</h2>
      <button 
        onClick={handleGenerateManga} 
        disabled={isGenerating}
        className={styles.generateButton}
      >
         <CreditIcon cost={getCostForPanelType(selectedPanelType)} />
        {isGenerating ? "Generating..." : "Generate Manga Panels"}
      </button>
      </div>

            
            {generationProgress.status && (
      <div className={styles.loading}>
        <div className={styles.loadingDots}>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
        </div>
        <p>{generationProgress.status}</p>
        {generationProgress.current > 0 && (
          <p>Progress: {generationProgress.current}/{generationProgress.total}</p>
        )}
      </div>
    )}
  <div className={styles.panelGrid}>
  {generatedPanels.map((pageData, pageIndex) => (
      <div key={pageIndex} className="{styles.panel}">
         <div 
         className="preview-container"
         onClick={() => setZoomedPage(pageData)}
         >
          <img
            src={pageData}
            alt={`Manga Page ${pageIndex + 1}`}
            className="full-page-image"
            onError={(e) => {
              console.error('Failed to load panel image:', pageData);
              e.currentTarget.style.display = 'none';
            }}
          />
          </div>
          <div className="page-number">Page {pageIndex + 1}</div>
      </div>
  ))}
  </div>
  <div className={styles.controls}>
      <button 
        onClick={downloadAllPages}
        className={styles.generateButton}
        disabled={generatedPanels.length === 0}
      >
        Download All Pages
      </button>
      </div>
  <canvas 
  ref={canvasRef}
  id="preview-canvas" 
  style={{ display: 'none' }} // Hide if not needed visually
/>

  {zoomedPage && (
  <div className="zoom-modal" onClick={() => setZoomedPage(null)}>
    <img
      src={zoomedPage}
      alt="Zoomed page"
      className="zoomed-image"
    />
  </div>
)}
 <div className="panel-type-note">
  <h3>📌 Panel Layout Notes</h3>
  <ul>
    <li>Use <strong>vertical panels</strong> for dramatic scenes</li>
    <li><strong>Horizontal panels</strong> work well for action sequences</li>
    <li>Click on preview pages to inspect details</li>
  </ul>

  <h4>⚠️ Character Description Tips</h4>
  <p>
    When describing characters, try and keep it <strong>brief and visual</strong>.
    Use <em>short phrases</em> instead of full sentences, and only include what
    can actually be seen in the image.
  </p>
  <p>
    <strong>Format:</strong> hair color + hair style, eye color, outfit (brief),
    expression, pose (if relevant), extras (like accessories or props)
  </p>

  <h4>Examples:</h4>
  <table className="prompt-table">
    <thead>
      <tr>
        <th>❌ Long Sentence</th>
        <th>✅ Efficient Prompt</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>She has long, shiny black hair and dark blue eyes.</td>
        <td>long black hair, dark blue eyes</td>
      </tr>
      <tr>
        <td>She is 5 ft 8 and slim with a confident expression.</td>
        <td>slim, confident expression</td>
      </tr>
      <tr>
        <td>She wears a white dress with a black belt.</td>
        <td>white dress, black belt</td>
      </tr>
      <tr>
        <td>She carries a handbag with both hands in front of her.</td>
        <td>holding handbag with both hands</td>
      </tr>
      <tr>
        <td>She is wearing makeup, has earrings and blush.</td>
        <td>makeup, earrings, light blush</td>
      </tr>
      <tr>
        <td>Her outfit blends traditional and modern elements.</td>
        <td>modern-traditional fusion outfit</td>
      </tr>
    </tbody>
  </table>
</div>
            {pathname === "/script-writing/ai-generate" && (
              <AIGenerateSection onGenerate={handleGenerateScript} />
            )}
          </div>
        </div>
      </div>
    );
  }
  