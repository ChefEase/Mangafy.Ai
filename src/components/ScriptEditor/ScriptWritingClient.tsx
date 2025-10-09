'use client';
import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../app/script-writing/Header";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { autoSave, loadSavedContent } from "../../utils/autoSave";
import { validateScript } from "../../utils/scriptValidation";
import ScriptEditorWrapper from "../ScriptEditorWrapper/ScriptEditorWrapper";
import { aiService, ArtStyle } from "../../services/aiService";
import '../../app/script-writing/styles/GenerationFeedback.css'
import '../../app/script-writing/styles/MangaPage.css'
import '../../app/script-writing/styles/ArtStyleDropDown.css'
import styles from '../../app/script-writing/styles/AIImageGenerator.module.css';
import LZString from 'lz-string'
import { useUser } from "@/context/UserContext";
import supabase from "@/utils/supabaseClient";
import { useCredits } from "@/context/CreditContext";
import { CharacterService, Character } from "@/services/CharacterService";
import  CharactersPage  from "../../app/characters/page";
import "./chatbot.css";
import ChatInterface from "../../components/chat/ChatInterface"
import MobileNav from "../../components/ScriptEditor/MobileNav"
import '../../app/script-writing/styles/global.css';
import { Footer } from "../Footer/Footer";

interface User {
  id: string;
  credits: number;
  subscription_tier: "free" | "starter" | "ultimate" | "starter_yearly" | "ultimate_yearly";
  // add others if needed
}

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
      const border = 2;

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
  const BORDER = 2;
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
  const BORDER = 2;
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
    const border = 2;
    const PANEL_WIDTH = A4_WIDTH - margin * 2; 
    const availableHeight = A4_HEIGHT - margin * 2;
    const PANEL_HEIGHT = availableHeight / 3 - margin / 3; // evenly spaced

    // Clear and set background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

    panels.forEach((panel, index) => {
      const img = panel.image;
      if (!img) return;

      // Position for this panel
      const y = margin + (PANEL_HEIGHT + margin / 2) * index;
      const x = margin;

      // Calculate scaling
      const scale = Math.min(
        PANEL_WIDTH / panel.dimensions.width,
        PANEL_HEIGHT / panel.dimensions.height
      );
      const scaledWidth = Math.round(panel.dimensions.width * scale);
      const scaledHeight = Math.round(panel.dimensions.height * scale);

      // Center image horizontally and vertically within its slot
      const xOffset = Math.round(x + (PANEL_WIDTH - scaledWidth) / 2);
      const yOffset = Math.round(y + (PANEL_HEIGHT - scaledHeight) / 2);

      // 🟩 Draw border using strokeRect for consistent width
      ctx.lineWidth = border;
      ctx.strokeStyle = 'black';
      ctx.strokeRect(
        Math.round(xOffset - border / 2),
        Math.round(yOffset - border / 2),
        Math.round(scaledWidth + border),
        Math.round(scaledHeight + border)
      );

      // 🖼️ Draw image
      ctx.drawImage(img, xOffset, yOffset, scaledWidth, scaledHeight);

      // 💬 Optional dialogue bubble
      if (panel.dialogue) {
        const bubbleX = xOffset + 50;
        const bubbleY = yOffset + scaledHeight - 150;

        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleY, 300, 80, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'black';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'left';
        wrapText(ctx, panel.dialogue, bubbleX + 15, bubbleY + 30, 270, 28);
      }
    });
  }
},
  'three-vertical-horizontal': {
panelCount: 3,
layout: (panels, ctx, A4_WIDTH, A4_HEIGHT) => {
  if (typeof window === 'undefined') return;
  const margin = 140;
  const border = 2;
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
  if (bottomPanel?.image) {
    const img = bottomPanel.image;
    const BOTTOM_WIDTH = A4_WIDTH * 0.9;
    const BOTTOM_HEIGHT = A4_HEIGHT * 0.5;
  
    const scale = Math.min(
      BOTTOM_WIDTH / img.width,
      BOTTOM_HEIGHT / img.height
    );
  
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
  
    const x = margin + (BOTTOM_WIDTH - scaledWidth) / 2;
    const y = margin + tallestTopPanelHeight + panelSpacing + border * 2;
  
    ctx.fillStyle = 'black';
    ctx.fillRect(x - border, y - border, scaledWidth + border * 2, scaledHeight + border * 2);
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
  }
});
}
},

  'three-horizontal-vertical': {
    panelCount: 3,
    layout: (panels, ctx, A4_WIDTH, A4_HEIGHT) => {
      if (typeof window === 'undefined') return;
      const margin = 140;
      const border = 2;
      const panelSpacing = 40;
      const topHeight = (A4_HEIGHT - margin*2 - panelSpacing) * 0.6;
      const bottomHeight = (A4_HEIGHT - margin*2 - panelSpacing) * 0.4;

      // Top horizontal panel
      const topPanel = panels[0];
      const imgTop = panels[0].image;
    if (!imgTop) return;

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
      if (imgTop) {
        ctx.drawImage(imgTop, x, y, scaledWidth, scaledHeight);
      }
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
    const [content, setContent] = useState<string>("");
    const [errors, setErrors] = useState<string[]>([]);
    const pathname = usePathname(); // Get the current route

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
// Inside ScriptWritingPage component, add state:
const [isChatbotOpen, setIsChatbotOpen] = useState(false);
const panelRef = useRef<HTMLDivElement>(null);
const searchParams = useSearchParams();
const [isMangafy, setIsMangafy] = useState(false);
const [guidanceScale, setGuidanceScale] = useState<number>(7); // string for typing
const [seedValue, setSeedValue] = useState<number | null>(null); // null == random
const [useCustomStyle, setUseCustomStyle] = useState(false);
const [customStyleDescription, setCustomStyleDescription] = useState("");
const customStyleRef = useRef<HTMLTextAreaElement | null>(null);
const [showControls, setShowControls] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);
const [navOpen, setNavOpen] = useState(false);
const [activeTab, setActiveTab] = useState<'script' | 'advanced'>('script');
const [panelPreviews, setPanelPreviews] = useState<(string | "generating")[]>([]);
const [gallery, setGallery] = useState<string[]>([]);

let touchTimer: NodeJS.Timeout | null = null;
let isTouchDragging = false;
let offsetX = 0;
let offsetY = 0;

const getCostForPanelType = (panelType: PanelType): number => {
  switch(panelType) {
    case 'one-portrait': return 12;
    case 'two-vertical': 
    case 'two-horizontal': return 22;
    default: return 30; // All three-panel layouts
  }
};

// Desktop mouse drag (unchanged)
const startDrag = (e: React.MouseEvent) => {
  if (window.innerWidth < 768) return; // disable on mobile
  const panel = panelRef.current;
  if (!panel) return;

  const startX = e.clientX;
  const startY = e.clientY;
  const rect = panel.getBoundingClientRect();
  const offX = startX - rect.left;
  const offY = startY - rect.top;

  const handleMouseMove = (ev: MouseEvent) => {
    panel.style.left = ev.clientX - offX + "px";
    panel.style.top = ev.clientY - offY + "px";
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

// Mobile touch long-press
const handleTouchStart = (e: React.TouchEvent) => {
  if (window.innerWidth >= 768) return; // only on mobile
  const touch = e.touches[0];
  const panel = panelRef.current;
  if (!panel) return;

  const rect = panel.getBoundingClientRect();
  offsetX = touch.clientX - rect.left;
  offsetY = touch.clientY - rect.top;

  // Wait 3 seconds before enabling drag
  touchTimer = setTimeout(() => {
    isTouchDragging = true;
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEndDoc);
  }, 3000);
};

const handleTouchMove = (e: TouchEvent) => {
  if (!isTouchDragging) return;
  e.preventDefault(); // prevent scrolling while dragging
  const touch = e.touches[0];
  const panel = panelRef.current;
  if (!panel) return;
  panel.style.left = touch.clientX - offsetX + "px";
  panel.style.top = touch.clientY - offsetY + "px";
};

const handleTouchEnd = (e: unknown) => {
  if (touchTimer) {
    clearTimeout(touchTimer);
    touchTimer = null;
  }
};

const handleTouchEndDoc = () => {
  isTouchDragging = false;
  document.removeEventListener("touchmove", handleTouchMove);
  document.removeEventListener("touchend", handleTouchEndDoc);
};

// Resizing
const startResize = (e: React.MouseEvent, corner: "tl" | "tr" | "bl" | "br") => {
  e.stopPropagation();
  if (window.innerWidth < 768) return; // disable on mobile
  const panel = panelRef.current;
  if (!panel) return;

  const startX = e.clientX;
  const startY = e.clientY;
  const startWidth = panel.offsetWidth;
  const startHeight = panel.offsetHeight;
  const startLeft = panel.offsetLeft;
  const startTop = panel.offsetTop;

  const handleMouseMove = (ev: MouseEvent) => {
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;

    if (corner.includes("r")) {
      newWidth = Math.max(300, startWidth + (ev.clientX - startX));
    }
    if (corner.includes("b")) {
      newHeight = Math.max(300, startHeight + (ev.clientY - startY));
    }
    if (corner.includes("l")) {
      newWidth = Math.max(300, startWidth - (ev.clientX - startX));
      newLeft = startLeft + (ev.clientX - startX);
    }
    if (corner.includes("t")) {
      newHeight = Math.max(300, startHeight - (ev.clientY - startY));
      newTop = startTop + (ev.clientY - startY);
    }

    panel.style.width = newWidth + "px";
    panel.style.height = newHeight + "px";
    panel.style.left = newLeft + "px";
    panel.style.top = newTop + "px";
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};


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
  function handleClickOutside(e: MouseEvent) {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setShowControls(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

    useEffect(() => {
      console.log("Building ScriptWritingClient"); // top of file
      console.log("Document is", typeof document); // should error if run on server

      if (!user?.id) return;
      if (canvasRef.current) {
        canvasRef.current.width = 2480;
        canvasRef.current.height = 3508;
      }
      const params = new URLSearchParams(window.location.search);
      const source = params.get("source");

      const savedScript = localStorage.getItem("saved-script");
      const selectedTemplate = localStorage.getItem("selected-template");
      const generatedScript = localStorage.getItem("script-content");
      // Fix: Ensure setContent always receives a string, never null
let initialContent = "";

    if (source === "ai" && generatedScript) {
      initialContent = generatedScript;
    } else if (source === "template" && selectedTemplate) {
      initialContent = selectedTemplate;
    } else {
      initialContent = savedScript || "";
    }
      setContent(initialContent);
      // Clean up used keys (optional)
    if (source === "template") {
      localStorage.removeItem("selected-template");
    }

    // Remove the query param from URL after use
    if (source) {
      const cleanURL = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanURL);
    }
    console.log("selectedTemplate", selectedTemplate);
    console.log("savedScript", savedScript);
    console.log("generatedScript", generatedScript)
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
    
    useEffect(() => {
      if (!searchParams) return; // 👈 prevent null access
    
      const source = searchParams.get("source");
      if (source === "template") {
        const tpl = localStorage.getItem("selected-template");
        if (tpl) {
          setContent(tpl);                           // put template into editor state
          localStorage.setItem("saved-script", tpl); // optional: keep as last saved
          localStorage.removeItem("selected-template");
        }
        // Clean up URL so refresh won't re-apply
        router.replace("/script-writing");
      }
    }, [searchParams, router]);
    
    // 1) helper to create a simple placeholder svg image as dataURL
function createPlaceholderDataUrl(w: number, h: number, label = "") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <rect x="8" y="8" width="${Math.max(1,w-16)}" height="${Math.max(1,h-16)}" fill="#f6f6f6" stroke="#000000" stroke-width="6" />
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="${Math.min(48, Math.floor(w/10))}" fill="#777">${label}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// 2) draw A4 preview on visible canvasRef whenever layout/preview data changes
useEffect(() => {
  if (typeof window === "undefined") return;
  const canvas = canvasRef.current;
  if (!canvas) return;

  // A4 internal pixel sizes you use for final export:
  const A4_W = 2480;
  const A4_H = 3508;

  // Ensure canvas is at full internal resolution
  canvas.width = A4_W;
  canvas.height = A4_H;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Build panels array for layout function. PANEL_CONFIG layout expects panel.image and .dimensions
  const panelCountForType = PANEL_CONFIG[selectedPanelType].panelCount;
  const panelsForLayout: PanelData[] = Array.from({ length: panelCountForType }).map((_, i) => {
    const dims = getPanelDimensions(i);
    const img = new Image();
    img.crossOrigin = "anonymous";

    // if a panel preview URL exists and is not "generating", use it; otherwise use placeholder svg
    const previewUrl = panelPreviews[i];
    if (previewUrl && previewUrl !== "generating") {
      img.src = previewUrl as string;
    } else {
      img.src = createPlaceholderDataUrl(dims.width, dims.height, previewUrl === "generating" ? "Generating..." : `Panel ${i+1}`);
    }

    return {
      url: "", // not needed for preview drawing
      dimensions: dims,
      dialogue: "",
      image: img
    };
  });

  // wait for all placeholder/preview images to be loaded, then call layout
  let isCancelled = false;
  Promise.all(panelsForLayout.map(p => new Promise<void>((res) => {
    if (p.image!.complete && p.image!.naturalWidth !== 0) return res();
    p.image!.onload = () => res();
    p.image!.onerror = () => res(); // continue even if an image fails
  }))).then(() => {
    if (isCancelled) return;

    // Clear canvas and scale background if desired (keep your A4 "paper" look if styles applied elsewhere)
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, A4_W, A4_H);

    // Use your existing panel layout function to draw the placeholder images/boxes
    try {
      PANEL_CONFIG[selectedPanelType].layout(panelsForLayout, ctx, A4_W, A4_H);
    } catch (err) {
      console.error("Error drawing preview layout:", err);
    }
  });

  return () => { isCancelled = true; };
}, [selectedPanelType, panelPreviews, generatedPanels, canvasRef]);


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

function floorToMultipleOf8(n: number): number {
  return Math.floor(n / 8) * 8;
}

function getOrUpdateSeed(currentScript: string): number {
  const storedScript = localStorage.getItem("lastScript");
  const storedSeed = localStorage.getItem("lastSeed");

  let seed: number;

  if (storedScript && storedScript === currentScript && storedSeed) {
    // Same script → regenerate with a NEW seed
    seed = Math.floor(Math.random() * 10_000_000);
    localStorage.setItem("lastSeed", seed.toString());
  } else {
    // New script → reuse existing seed if available, else make one
    if (storedSeed) {
      seed = parseInt(storedSeed, 10);
    } else {
      seed = Math.floor(Math.random() * 10_000_000);
      localStorage.setItem("lastSeed", seed.toString());
    }
    localStorage.setItem("lastScript", currentScript);
  }

  return seed;
}

  const cost = getCostForPanelType(selectedPanelType);
    const handleGenerateManga = async () => {
      if (typeof window === 'undefined') return;
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
        setPanelPreviews(Array(panelCount).fill("generating"));

        // Generate images with proper dimensions
        const newPanels = [];
          for (let i = 0; i < processedPanels.length; i++) {
            const dimensions = getPanelDimensions(i);
            const targetWidth = dimensions.width;
            const targetHeight = dimensions.height;
            const panelData = processedPanels[i];

            const requestWidth = floorToMultipleOf8(targetWidth / 2);
            const requestHeight = floorToMultipleOf8(targetHeight / 2);
            const parsedGuidance = guidanceScale;
            const guidanceScaleToSend = !isNaN(parsedGuidance) ? parsedGuidance : 7;     
            const seed = seedValue !== null
            ? seedValue
            : getOrUpdateSeed(panelData.scene);
            console.log("Guidance Scale being sent:", guidanceScaleToSend);
            console.log(`Sending to Replicate: ${requestWidth} x ${requestHeight}`);
            const panelImage = await aiService.generatePanel({
              scene: panelData.scene,
              characters: characters.filter(c => c.image),
              style: selectedStyle,
              cameraAngle: panelData.cameraAngle,
              width: requestWidth,
              height: requestHeight,
              color: selectedColor, // ✅ Fix: Include this
              gradioStyle: selectedPreset, // ✅ Also needed if using Gradio
              seed,// ✅ custom or fallback
              guidanceScale: guidanceScaleToSend,                     // ✅ custom or fallback
              isMangafy,
              customStyle: useCustomStyle ? (customStyleRef.current?.value ?? customStyleDescription) : null
            });

            if (!(panelImage instanceof Blob)) {
              console.error("Panel image is not a blob!", panelImage);
              throw new Error("Invalid panel image format");
            }
            
            if (!panelImage || panelImage.size < 1000) {
              throw new Error("Empty or corrupted image blob");
            }
            
            let blob = panelImage; // that's the smaller blob
            const upscaledBlob = await upscaleBlob(panelImage, targetWidth, targetHeight);
            setPanelPreviews(prev => {
              const updated = [...prev];
              updated[i] = URL.createObjectURL(upscaledBlob);
              return updated;
            });

            newPanels.push({
              url: URL.createObjectURL(upscaledBlob),
              dimensions: { width: targetWidth, height: targetHeight },
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
      setGallery(prev => [...prev, ...generatedPanels]);
    };

    async function upscaleBlob(blob: Blob, width: number, height: number): Promise<Blob> {
      const imgBitmap = await createImageBitmap(blob);
    
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
    
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imgBitmap, 0, 0, width, height);
    
      return await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Upscale failed"));
        }, "image/png");
      });
    }
    
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
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
        if (isIOS) {
          // Open image in new tab, user can long-press to save
          const newWindow = window.open();
          if (newWindow) {
            newWindow.document.write(`<img src="${pageData}" style="max-width:100%"/>`);
          }
        } else {
          const link = document.createElement('a');
          link.href = pageData;
          link.download = `manga_page_${index + 1}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
    
        if (index === 0) {
          sessionStorage.setItem('templateImage', LZString.compressToUTF16(pageData));
        }
      });
    };
    
    function randomVarLengthSeed(): number {
      // Choose a random length 1..7, produce a number of that length,
      // BUT never exceed 2,100,000 (cap).
      const MAX_CAP = 2100000;
      const len = Math.floor(Math.random() * 7) + 1; // 1..7
      const min = len === 1 ? 1 : Math.pow(10, len - 1);
      const maxForLen = Math.pow(10, len) - 1;
      const cappedMax = Math.min(maxForLen, MAX_CAP);
    
      if (min > cappedMax) {
        // If length's min is already above the cap (shouldn't happen for len<=7),
        // just return a uniform random within 1..MAX_CAP as a safe fallback.
        return Math.floor(Math.random() * MAX_CAP) + 1;
      }
    
      return Math.floor(Math.random() * (cappedMax - min + 1)) + min;
    }
    
    
    const ColorOptionSelector = ({ 
      selectedColor,
      onChange 
    }: {
      selectedColor: ColorOption;
      onChange: (color: ColorOption) => void;
    }) => (
      <>
      <div className={styles.controlGroup}>
        <label>Color Option:</label>
        <select
          value={selectedColor}
          onChange={(e) => onChange(e.target.value as ColorOption)}
          className={styles.select}
        >
          <option value="black_white">Black and White</option>
          <option value="colored"  disabled={isMangafy}  >Full Color</option>
        </select>
      </div>

      <div className={styles.controlGroup}>
  <label>
    <input
      type="checkbox"
      checked={isMangafy}
      disabled={selectedStyle === "default" || useCustomStyle}  // 🚫 disable if default manga
      onChange={(e) => {
        const checked = e.target.checked;
        setIsMangafy(checked);

        // Force black & white if mangafy checked
        if (checked) {
          setSelectedColor("black_white");
        }
      }}
    />
     <span>Mangafy (Optional)</span>
  </label>

{/* Use Custom Art Style */}
<div className="form-group">
  <label>
    <input
      type="checkbox"
      checked={useCustomStyle}
      onChange={(e) => setUseCustomStyle(e.target.checked)}
      disabled={isMangafy} // disable toggle if Mangafy is active
    />
    Use Custom Art Style
  </label>

  {/* Uncontrolled textarea to avoid re-render / IME focus loss while typing */}
  <textarea
    ref={customStyleRef}
    placeholder="Enter your custom art style description..."
    defaultValue={customStyleDescription}          // uncontrolled for smooth typing
  onInput={() => { /* keep typing fluid — don't call setState here */ }}
  onBlur={() => setCustomStyleDescription(customStyleRef.current?.value || "")}
    disabled={!useCustomStyle}
    rows={4}
    style={{ width: '100%', resize: 'vertical', background: 'white' }}
  />
</div>

</div>

<div className={styles.controlGroup}>
  <label>Guidance Scale (1–15) (Optional):</label>
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
<input
type="range"
min={1}
max={15}
value={guidanceScale}
onChange={(e) => setGuidanceScale(parseInt(e.target.value, 10))}
/>
<span style={{ minWidth: 28, textAlign: 'center' }}>{guidanceScale}</span>
</div>
</div>

<div className={styles.controlGroup}>
  <label>Seed: (Optional)</label>
  <div className={styles.controlGroupInner}>
    <input
      type="range"
      min={1}
      max={2100000}
      value={seedValue ?? 1}                         // show 1 when null
      onChange={(e) => setSeedValue(parseInt(e.target.value, 10))}
    />
    <input
      type="number"
      value={seedValue ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        setSeedValue(v === '' ? null : parseInt(v, 10));
      }}
      placeholder="random"
      style={{ width: 120 }}
    />
   <button type="button" onClick={() => setSeedValue(randomVarLengthSeed())}>
  Randomize
</button>
  </div>
</div>

</>
    );
    
const AnimeStyleSelector = ({ selectedStyle, onChange, disabled }: StyleSelectorProps & { disabled?: boolean }) => (
  <div className={styles.controlGroup}>
    <label>Art Style:</label>
    <select 
      value={selectedStyle} 
      onChange={(e) => onChange(e.target.value as ArtStyle)}
      className={styles.select}
      disabled={disabled}
      aria-disabled={disabled}
    >
      <option value="default">Default Manga</option>
      <option value="one-piece">One Piece (Eiichiro Oda)</option>
      <option value="jujutsu-kaisen">Jujutsu Kaisen (Gege Akutami)</option>
      <option value="my-hero-academia">My Hero Academia (Kohei Horikoshi)</option>
      <option value="dandadaan">Dandadan (Yukinobu Tatsu)</option>
      <option value="quintessential-quintuplets">Quintessential Quintuplets (Negi Haruba)</option>
      <option value="tokyo-revengers">Tokyo Revengers (Ken Wakui)</option>
      <option value="comic-book">Comic Book (Marvel/DC)</option> {/* ✅ New Style */}
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

// Add CreditIcon component
const CreditIcon = ({ cost }: { cost: number }) => (
  <div className={styles.creditBadge}>
    <img src="/credit-icon.png" alt="Credits" className={styles.creditIcon} />
    <span className={styles.creditCost}>{cost}</span>
  </div>
);

return (
  <>    
    <Header />
    <div className={styles.header}>
      <h2>Manga Creator Studio</h2>
      <p className={styles.subtitle}>
        Transform your script into professional manga panels
      </p>
    </div>

    {/* Left sidebar with tabs */}
    <div className="script-sidebar-fixed">
    <div className={styles["tab-header"]}>
    <button
    className={activeTab === "script" ? styles.active : ""}
    onClick={() => setActiveTab("script")}
  >
    Script Box
  </button>
  <button
    className={activeTab === "advanced" ? styles.active : ""}
    onClick={() => setActiveTab("advanced")}
  >
    Advanced Options
  </button>
      </div>

      {activeTab === 'script' && (
        <div className="script-editor-container">
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
          />
        </div>
      )}

      {activeTab === 'advanced' && (
        <div className={styles.controls}>
          <StylePresetSelector 
            selectedPreset={selectedPreset} 
            onChange={setSelectedPreset} 
          />
          <AnimeStyleSelector 
            selectedStyle={selectedStyle} 
            onChange={setSelectedStyle} 
            disabled={useCustomStyle} 
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
        </div>
      )}
    </div>
    <div className={styles.generateWrapper}>
  <button 
    onClick={handleGenerateManga} 
    className={styles.generateButton}
    disabled={isGenerating}
  >
    <CreditIcon cost={cost} /> 🎨 Generate
  </button>
</div>
    {/* Right sidebar */}
    <div className="characters-sidebar-fixed desktop-only">
      <CharactersPage />
    </div>

    {/* Floating Chatbot Button */}
    {!isChatbotOpen && (
      <div className="chatbot-toggle desktop-only" onClick={() => setIsChatbotOpen(true)}>
        <div className="chatbot-plus">+</div>
        <span className="chatbot-label">Chatbot</span>
      </div>
    )}

    {/* Chatbot Panel */}
    {isChatbotOpen && (
      <div
        className="chatbot-panel"
        ref={panelRef}
        onMouseDown={(e) => startDrag(e)}
        onTouchStart={(e) => handleTouchStart(e)}
        onTouchEnd={(e) => handleTouchEnd(e)}
      >
        <button
          className="chatbot-close"
          onClick={() => setIsChatbotOpen(false)}
        >
        </button>
        <div className="chatbot-iframe">
          <ChatInterface />
        </div>

        {/* Resize handles */}
        <div className="resize-handle top-left" onMouseDown={(e) => startResize(e, "tl")} />
        <div className="resize-handle top-right" onMouseDown={(e) => startResize(e, "tr")} />
        <div className="resize-handle bottom-left" onMouseDown={(e) => startResize(e, "bl")} />
        <div className="resize-handle bottom-right" onMouseDown={(e) => startResize(e, "br")} />
      </div>
    )}

    {/* Generated Panels */}
   {/* === Visible A4 preview (always rendered) === */}
<div className={styles.previewGrid} style={{ alignItems: 'flex-start' }}>
  {/* Canvas wrapper; keep your own wrapper styles/classes if you have them */}
  <div style={{
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",      // centers vertically
    minHeight: "70vh",         // makes sure it centers in the visible area
    padding: "24px 0",
    gap: 0
  }}>
    <div style={{ width: 640, maxWidth: '95%',  justifyContent: "center",
    alignItems: "center",   }}>
      <canvas
        ref={canvasRef}
        aria-label="Manga page preview"
        // inline CSS ensures canvas is visible for now — you can remove/replace with your own wrapper style
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          background: '#fff',
        }}
      />
    </div>
  </div>

  {/* Keep your old panel placeholders (hidden visually) — this preserves any other logic that depends on this markup */}
  <div style={{ display: 'none' }}>
    {panelPreviews.map((preview, i) => (
      <div key={i} className={styles.previewPanel}>
        {preview === "generating" ? (
          <div className={styles.loading}>Generating...</div>
        ) : (
          <img src={preview as string} alt={`Panel ${i + 1}`} />
        )}
      </div>
    ))}
  </div>
</div>

{/* wrapper that provides a containing block for absolute positioning */}
<div style={{ position: 'relative' }}>
  {/* Download button: absolute, can override position via inline style variables below */}
  <button
    className={styles.downloadButtonAbsolute}
    onClick={downloadAllPages}
    aria-label="Download all pages"
    // You can tweak position here by changing the CSS variables:
    // e.g. set top to '48px' or left to '50%' or left to '60%' etc.
    style={{
      ['--download-top' as any]: '528px',     // desktop top offset
      ['--download-left' as any]: '50%',     // horizontal center
      ['--download-translateX' as any]: '-50%' // default center transform
    }}
  >
    Download All Pages
  </button>

  {/* Actual gallery */}
  <div className={styles.gallery}>
    {gallery.map((img, i) => (
      <div key={i} className={styles.galleryItem} onClick={() => setZoomedPage(img)}>
        <img src={img} alt={`Saved ${i+1}`} className={styles.galleryThumb}/>
      </div>
    ))}
  </div>
</div>
<div>
        <MobileNav /> {/* Only visible on mobile */}
        </div>
  </>
);

  }
  
  const seedCache: Record<string, number> = {};

export function getOrUpdateSeed(scene: string): number {
  if (!seedCache[scene]) {
    seedCache[scene] = Math.floor(Math.random() * 2_000_000); // new seed
  }
  return seedCache[scene];
}