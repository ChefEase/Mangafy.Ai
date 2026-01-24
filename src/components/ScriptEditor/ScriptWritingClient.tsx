'use client';
import { useEffect, useRef, useState } from "react";
import Header from "../../app/script-writing/Header";
import { useRouter, useSearchParams } from "next/navigation";
import { autoSave } from "../../utils/autoSave";
import { validateScript } from "../../utils/scriptValidation";
import ScriptEditorWrapper from "../ScriptEditorWrapper/ScriptEditorWrapper";
import { aiService, ArtStyle } from "../../services/aiService";
import '../../app/script-writing/styles/GenerationFeedback.css'
import '../../app/script-writing/styles/MangaPage.css'
import '../../app/script-writing/styles/ArtStyleDropDown.css'
import styles from '../../app/script-writing/styles/AIImageGenerator.module.css';
import LZString from 'lz-string'
import { useUser } from "@/context/UserContext";
import { useCredits } from "@/context/CreditContext";
import { CharacterService, Character } from "@/services/CharacterService";
import  CharactersPage  from "../../app/characters/page";
import "./chatbot.css";
import ChatInterface from "../../components/chat/ChatInterface"
import MobileNav from "../../components/ScriptEditor/MobileNav"
import '../../app/script-writing/styles/global.css';
import { v4 as uuidv4 } from "uuid";
import { saveSnapshotToDB, initDB } from '../../utils/db';
import { getOrUpdateSeed } from "../../utils/seeds";

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

  type PanelType = 
  | 'one-portrait' 
  | 'two-vertical' 
  | 'two-horizontal' 
  | 'three-default' 
  | 'three-vertical-horizontal' 
  | 'three-horizontal-vertical';

  type MoodType =
  | "none"
  | "noir"
  | "sunset"
  | "dramatic"
  | "cool"
  | "warm"
  | "vintage"
  | "neon"
  | "cinematic";

  interface PanelConfig {
    panelCount: number;
    layout: (panels: PanelData[], ctx: CanvasRenderingContext2D, A4_WIDTH: number, A4_HEIGHT: number) => void;
  }

  type ColorOption = "black_white" | "colored";
type GradioStyle = "Cinematic" | "Photographic" | "Anime" | "Manga" | "Digital Art" | "Pixel art" | "Fantasy art" | "Neonpunk" | "3D Model";
// ================================
// Narrative Controller (STEP 1.5)
// ================================

type PanelIntent =
  | "establishing"
  | "dialogue"
  | "action"
  | "transition"
  | "hybrid";

interface NarrativeState {
  scriptId: string;
  panelCount: number;
  panelIndex: number;
  activeCharacters: string[];
  location: string | null;
  mood: string | null;
  lastPanelSummary: string | null;
}

class NarrativeController {
  private state: NarrativeState;

  constructor(scriptId: string, panelCount: number) {
    this.state = {
      scriptId,
      panelCount,
      panelIndex: 0,
      activeCharacters: [],
      location: null,
      mood: null,
      lastPanelSummary: null
    };
  }

    /** Hard reset when starting a brand-new generation run */
    resetForNewRun() {
      this.state.panelIndex = 0;
      this.state.lastPanelSummary = null;
      this.persist();
    }
  
  /** Reset controller if panel count changes */
  resetIfNeeded(panelCount: number) {
    if (this.state.panelCount !== panelCount) {
      this.state.panelCount = panelCount;
      this.state.panelIndex = 0;
      this.state.lastPanelSummary = null;
      this.persist();
    }
  }

  /** Infer panel intent (HYBRID, rule-based only) */
  inferPanelIntent(panel: {
    scene: string;
    dialogue?: string;
  }): PanelIntent {
    const dialogueLength = panel.dialogue?.length ?? 0;

    if (dialogueLength > 120) return "dialogue";
    if (/fight|run|attack|explosion|jump|punch/i.test(panel.scene)) return "action";
    if (this.state.panelIndex === 0) return "establishing";

    return "hybrid";
  }

  /** Build narrative directives (NO camera override) */
  buildNarrativeDirectives(intent: PanelIntent): {
    intent: PanelIntent;
    continuity: "strict" | "loose" | "medium";
    lockEnvironment: boolean;
    allowPoseChange: boolean;
    previousPanelSummary: string | null;
  } {
    return {
      intent,
      continuity:
        intent === "dialogue"
          ? "strict"
          : intent === "action"
          ? "loose"
          : "medium",
      lockEnvironment: intent === "dialogue",
      allowPoseChange: intent !== "dialogue",
      previousPanelSummary: this.state.lastPanelSummary
    };
  }

  /** Update controller from generated image summary */
  updateFromImageSummary(summary: string | null) {
    if (!summary) return;
    this.state.lastPanelSummary = summary;
    this.state.panelIndex += 1;
    this.persist();
  }

  /** Persist narrative memory per script */
  persist() {
    try {
      localStorage.setItem(
        `narrative_state_${this.state.scriptId}`,
        JSON.stringify(this.state)
      );
    } catch (err) {
      console.warn("Failed to persist narrative state", err);
    }
  }

  /** Restore narrative memory (optional use later) */
  restore() {
    try {
      const raw = localStorage.getItem(
        `narrative_state_${this.state.scriptId}`
      );
      if (raw) this.state = JSON.parse(raw);
    } catch (err) {
      console.warn("Failed to restore narrative state", err);
    }
  }
}

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
const [selectedMood, setSelectedMood] = useState<MoodType>("none");
const originalImageRef = useRef<HTMLImageElement | null>(null);
const [snapshotName, setSnapshotName] = useState("");
const [showNamePrompt, setShowNamePrompt] = useState(false);
const [showConfirm, setShowConfirm] = useState(false);
// near your other useState declarations
const [zoomedId, setZoomedId] = useState<string | null>(null);
const canTransition = panelCount > 1;
const [transitioning, setTransitioning] = useState(true);


let touchTimer: NodeJS.Timeout | null = null;
let isTouchDragging = false;
let offsetX = 0;
let offsetY = 0;

const handleSnapshotClick = () => {
  setShowConfirm(true);
};

// 🟠 Confirm saving snapshot
const confirmSnapshot = () => {
  setShowConfirm(false);
  setShowNamePrompt(true);
};

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

      try {
        const cleanDataUrl = canvas.toDataURL("image/png");
        const savedImg = new Image();
        savedImg.crossOrigin = "anonymous";
        savedImg.src = cleanDataUrl;
        // Wait for the image to be decoded so applyMoodEffect can use it synchronously later
        await new Promise<void>((resolve) => {
          if (savedImg.complete) return resolve();
          savedImg.onload = () => resolve();
          savedImg.onerror = () => resolve(); // still resolve on error to avoid blocking
        });
        originalImageRef.current = savedImg;
      } catch (err) {
        console.warn("Failed to save clean canvas image for mood switching:", err);
      }

      pages.push(canvas.toDataURL('image/png'));
      return pages;
    };
} 

useEffect(() => {
  if (!canTransition) {
    setTransitioning(false); // 1 panel => forced off + greyed out
  } else {
    setTransitioning(true); // switching to 2+ panels => auto checked
  }
}, [canTransition]);

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
      const source = searchParams.get("source");
    
      const savedScript = localStorage.getItem("saved-script") || "";
      const selectedTemplate = localStorage.getItem("selected-template");
      const generatedScript = localStorage.getItem("script-content");
    
      let next = savedScript;
    
      if (source === "ai" && generatedScript) next = generatedScript;
      if (source === "template" && selectedTemplate) next = selectedTemplate;
    
      setContent(next);
    
      // optional: make template become the current saved script
      if (source === "template" && selectedTemplate) {
        localStorage.setItem("saved-script", selectedTemplate);
        localStorage.removeItem("selected-template");
      }
    
      // clean URL
      if (source) router.replace("/script-writing");
    }, [searchParams, router]);
    
    
    async function deleteImageBlobFromDB(id: string) {
      const db = await openImageDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction("images", "readwrite");
        const store = tx.objectStore("images");
        const req = store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
    
    // 1) helper to create a simple placeholder svg image as dataURL
function createPlaceholderDataUrl(w: number, h: number, label = "") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <rect x="8" y="8" width="${Math.max(1,w-16)}" height="${Math.max(1,h-16)}" fill="#f6f6f6" stroke="#000000" stroke-width="6" />
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="${Math.min(48, Math.floor(w/10))}" fill="#777">${label}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function applyMoodEffect(mood: MoodType) {
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;

  // If no generated image, stop
  if (!originalImageRef.current) {
    alert("Please generate an image before applying a mood.");
    return;
  }

  const doDraw = () => {
    // Clear the canvas fully
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Prepare filter string
    let filter = "none";
    switch (mood) {
      case "noir":
        filter = "grayscale(100%) contrast(1.3)";
        break;
      case "sunset":
        filter = "brightness(1.08) sepia(0.35) hue-rotate(-15deg)";
        break;
      case "dramatic":
        filter = "contrast(1.4) brightness(0.92)";
        break;
      case "cool":
        filter = "contrast(1.05) hue-rotate(200deg) saturate(1.05)";
        break;
      case "warm":
        filter = "brightness(1.04) sepia(0.28) saturate(1.08)";
        break;
      case "vintage":
        filter = "sepia(0.55) contrast(1.05) saturate(0.9)";
        break;
      case "neon":
        filter = "saturate(1.9) brightness(1.08)";
        break;
      case "cinematic":
        filter = "contrast(1.25) brightness(0.96) saturate(0.95)";
        break;
      case "none":
      default:
        filter = "none";
    }

    // Draw with the desired filter once (don't draw twice)
    ctx.filter = filter;
    ctx.drawImage(originalImageRef.current as HTMLImageElement, 0, 0, canvas.width, canvas.height);

    // Reset filter for any future operations
    ctx.filter = "none";
  };

  // If the image is still decoding, wait for its load event
  if (!originalImageRef.current.complete) {
    originalImageRef.current.onload = () => doDraw();
    originalImageRef.current.onerror = () => doDraw();
  } else {
    doDraw();
  }
}

function handleMoodChange(mood: MoodType) {
  setSelectedMood(mood);
  applyMoodEffect(mood);
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

    // Save a preview clean image for mood switching (preview-level)
try {
  if (canvasRef.current) {
    const previewDataUrl = canvasRef.current.toDataURL("image/png");
    const previewImg = new Image();
    previewImg.crossOrigin = "anonymous";
    previewImg.src = previewDataUrl;
    previewImg.onload = () => { originalImageRef.current = previewImg; };
    previewImg.onerror = () => { /* ignore */ };
  }
} catch (e) {
  console.warn("Couldn't save preview for mood switching:", e);
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
  
function floorToMultipleOf8(n: number): number {
  return Math.floor(n / 8) * 8;
}

  const cost = getCostForPanelType(selectedPanelType);
  function narrativeController_makeScriptIdFromText(text: string): string {
    // simple deterministic hash (no crypto)
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return `script_${hash.toString(16)}`;
  }
 
  // NarrativeController helper: only pass characters that are mentioned in the panel text
function narrativeControllerFilterCharactersForPanel(
  sceneText: string,
  allCharacters: any[]
) {
  const s = (sceneText || "").toLowerCase();
  // match by character.name if present, else fallback to id or role
  const matched = (allCharacters || []).filter((c: any) => {
    const name = String(c?.name || "").toLowerCase().trim();
    if (!name) return false;
    return s.includes(name);
  });

  // fallback: if nothing matched, pass empty and let the prompt be scene-only
  return matched;
}

function narrativeControllerApplyOutfitOverrides(
  rawScene: string,
  characters: any[]
) {
  let scene = rawScene;

  const overrides: Record<string, string> = {};
  // crude but effective: "NAME is wearing ..."
  const re = /\b([A-Z][a-z]+)\s+is\s+wearing\s+([^.\n]+)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(rawScene)) !== null) {
    overrides[m[1].toLowerCase()] = m[2].trim();
  }

  const updatedChars = (characters || []).map((c: any) => {
    const name = String(c?.name || "").trim();
    const key = name.toLowerCase();
    if (!overrides[key]) return c;

    // append outfit to description (so it stays the same character, not a new one)
    return {
      ...c,
      description: `${c.description}. Outfit override this panel: ${overrides[key]}`,
    };
  });

  // optional: remove the outfit sentence from scene after capturing it (prevents double counting)
  scene = scene.replace(re, "").trim();

  return { scene, characters: updatedChars };
}

function narrativeControllerExtractOutfitOverrides(scene: string) {
  const overrides: Record<string, string> = {};
  const re = /\b([A-Z][a-z]+)\s+is\s+wearing\s+([^.\n]+)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(scene)) !== null) {
    overrides[m[1].toLowerCase()] = m[2].trim();
  }
  return overrides;
}

function narrativeControllerStripClothing(desc: string) {
  // blunt but works: remove common clothing words + anything after them until comma/period
  // tweak list anytime
  const clothingWords = [
    "suit","tie","shirt","t-shirt","tshirt","hoodie","jacket","coat","pants","trousers","jeans",
    "skirt","dress","sweatpants","shorts","shoes","sneakers","sandals","boots","uniform"
  ];

  let out = desc;
  for (const w of clothingWords) {
    const r = new RegExp(`\\b${w}\\b[^,.;]*`, "gi");
    out = out.replace(r, "");
  }
  return out.replace(/\s+,/g, ",").replace(/,+/g, ",").trim();
}

function narrativeControllerApplyOutfitOverridesToCharacters(
  scene: string,
  panelCharacters: any[]
) {
  const overrides = narrativeControllerExtractOutfitOverrides(scene);

  const updated = (panelCharacters || []).map((c: any) => {
    const name = String(c?.name || "").trim();
    const key = name.toLowerCase();
    if (!name || !overrides[key]) return c;

    const stripped = narrativeControllerStripClothing(String(c.description || ""));
    return {
      ...c,
      description: `${stripped}. Outfit THIS PANEL: ${overrides[key]}`,
    };
  });

  return updated;
}

    const handleGenerateManga = async () => {
      let previousPanelSummary: string | null = null;

      originalImageRef.current = null;
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
        const scriptId = narrativeController_makeScriptIdFromText(plainOutline);
        const narrativeController = new NarrativeController(scriptId, panelCount);
        narrativeController.resetIfNeeded(panelCount);
        narrativeController.restore();
        narrativeController.resetForNewRun();

        const rawPanels = await aiService.generateScenesFromOutline(plainOutline, panelCount);
        const limitedPanels = rawPanels.slice(0, MAX_PANELS);
        console.log("Limited Panels:", limitedPanels); // Debug log
  
        if (!limitedPanels || limitedPanels.length === 0) {
          throw new Error("No panels generated - check AI response");
        }
  
        
      // ✅ object-safe validation
const hasUndefined = limitedPanels.some((panel: any) => {
  const scene = typeof panel?.scene === "string" ? panel.scene : "";
  const camera = typeof panel?.camera === "string" ? panel.camera : "";
  const dialogue = typeof panel?.dialogue === "string" ? panel.dialogue : "";

  return (
    scene.includes("undefined") ||
    camera.includes("undefined") ||
    dialogue.includes("undefined") ||
    !scene.trim() ||
    !camera.trim()
  );
});

if (hasUndefined) {
  console.warn("Undefined / invalid values detected in:", limitedPanels);
  throw new Error("AI generated incomplete panels - try regenerating");
}

const invalid = limitedPanels.some((p: any) =>
  !p || typeof p !== "object" ||
  !String(p.scene || "").trim() ||
  !String(p.camera || "").trim()
  // dialogue can be empty sometimes, so don't hard-fail it unless you want to
);

if (invalid) {
  console.warn("Invalid panels detected:", limitedPanels);
  throw new Error("AI generated incomplete panels (missing scene/camera). Try regenerating.");
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
        const processedPanels = limitedPanels.map((panel: any) => {
          const rawScene = String(panel.scene || "").trim();
          const dialogue = String(panel.dialogue || "").trim();
          const cameraAngle = String(panel.camera || "medium").trim();
        
          const panelCharacters = narrativeControllerFilterCharactersForPanel(rawScene, latestCharacters);
        
          return {
            rawScene,
            dialogue,
            cameraAngle,
            panelCharacters,
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
// STEP 1.5 — Narrative Controller integration
const panelIntent = narrativeController.inferPanelIntent({
  scene: panelData.rawScene,
  dialogue: panelData.dialogue
});

const narrativeDirectives =
  narrativeController.buildNarrativeDirectives(panelIntent);
  const transitionEnabled = panelCount > 1 && transitioning;

  const effectiveNarrativeDirectives = transitionEnabled
    ? narrativeDirectives
    : {
        ...narrativeDirectives,
        continuity: "loose" as const,
        lockEnvironment: false,
        allowPoseChange: true,
        previousPanelSummary: null
      };
  
            const requestWidth = floorToMultipleOf8(targetWidth / 2);
            const requestHeight = floorToMultipleOf8(targetHeight / 2);
            const parsedGuidance = guidanceScale;
            const guidanceScaleToSend = !isNaN(parsedGuidance) ? parsedGuidance : 7;     
            const seed = seedValue !== null
            ? seedValue
            : getOrUpdateSeed(panelData.rawScene);
            console.log("Guidance Scale being sent:", guidanceScaleToSend);
            console.log(`Sending to Replicate: ${requestWidth} x ${requestHeight}`);
            const patched = narrativeControllerApplyOutfitOverrides(panelData.rawScene, panelData.panelCharacters);
            const panelChars = narrativeControllerApplyOutfitOverridesToCharacters(
              panelData.rawScene,
              panelData.panelCharacters
            );
            const prevSummaryForThisPanel =
  i === 0 ? null : effectiveNarrativeDirectives.previousPanelSummary;

            const panelImage = await aiService.generatePanel({
              scene: patched.scene,
              characters: panelChars,
              cameraAngle: panelData.cameraAngle,
              style: selectedStyle,
              width: requestWidth,
              height: requestHeight,
              color: selectedColor, // ✅ Fix: Include this
              gradioStyle: selectedPreset, // ✅ Also needed if using Gradio
              seed,// ✅ custom or fallback
              guidanceScale: guidanceScaleToSend,                     // ✅ custom or fallback
              isMangafy,
              customStyle: useCustomStyle ? (customStyleRef.current?.value ?? customStyleDescription) : null,
              previousPanelSummary: prevSummaryForThisPanel,
narrativeIntent: effectiveNarrativeDirectives.intent,
continuityMode: effectiveNarrativeDirectives.continuity,
lockEnvironment: effectiveNarrativeDirectives.lockEnvironment,
allowPoseChange: effectiveNarrativeDirectives.allowPoseChange,
transitionEnabled,
            });

            let currentPanelSummary: string | null = null;

            try {
              currentPanelSummary = await aiService.generateImageDescription(panelImage);
            } catch {
              currentPanelSummary = null;
            }

            if (!currentPanelSummary) {
              // NarrativeController fallback summary (no provider needed)
              const names = (panelData.panelCharacters || []).map((c: any) => c?.name).filter(Boolean).join(", ");
              currentPanelSummary = `Characters: ${names || "unknown"}. Scene: ${panelData.rawScene}. Camera: ${panelData.cameraAngle}.`;
            }
            // STEP 1.5 — update narrative memory
            narrativeController.updateFromImageSummary(currentPanelSummary);
            
            console.log("characters before filter for images:", characters);
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
        // Save pages into IndexedDB + save small thumbnail + metadata to localStorage
try {
  const newEntries: { id: string; thumb: string; createdAt: number }[] = [];
  for (let i = 0; i < pages.length; i++) {
    const pageDataUrl = pages[i]; // data:image/png;base64,...
    const id = `page-${Date.now()}-${Math.floor(Math.random() * 1e6)}-${i}`; // unique id
    const blob = dataURLToBlob(pageDataUrl);
    // Save full blob to IndexedDB
    await saveImageBlobToDB(id, blob);
    // Create a small thumbnail for metadata/localStorage (safe to store)
    const thumb = await createThumbnailFromDataUrl(pageDataUrl, 300);
    newEntries.push({ id, thumb, createdAt: Date.now() });
  }

  // update UI gallery state immediately with metadata entries
  setGallery(prev => [...prev, ...newEntries.map(e => JSON.stringify({ id: e.id, thumb: e.thumb }))]);

  // persist metadata (thumbnails + ids) to localStorage (small)
  try {
    const existing = JSON.parse(localStorage.getItem('gallery_meta') || '[]');
    localStorage.setItem('gallery_meta', JSON.stringify(existing.concat(newEntries.map(e => ({ id: e.id, thumb: e.thumb, createdAt: e.createdAt })) )));
  } catch (err) {
    console.warn("Failed to save gallery_meta (localStorage), skipping:", err);
  }
} catch (err) {
  console.error("Failed to save generated pages to IndexedDB:", err);
}

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

    const saveSnapshot = async () => {
      if (!canvasRef.current || !snapshotName.trim()) return;
    
      const newSnapshot = {
        id: uuidv4(),
        name: snapshotName,
        image: canvasRef.current.toDataURL("image/png"),
        prompt: content,
        stylePreset: selectedPreset,
        artStyle: selectedStyle,
        panelLayout: selectedPanelType,
        colorOption: selectedColor,
        moodPreset: selectedMood,
        mangafyChecked: isMangafy,
        customArtStyle: useCustomStyle ? customStyleDescription : null,
        guidanceScale,
        seed: seedValue
      };
    
      try {
        await saveSnapshotToDB(newSnapshot);
        setSnapshotName("");
        setShowNamePrompt(false);
        alert("✅ Snapshot saved! You can view it in the snapshot page in the header dropdown menu");
      } catch (error) {
        console.error("Failed to save snapshot:", error);
        alert("❌ Failed to save snapshot.");
      }
    };
    useEffect(() => {
      try {
        const meta = JSON.parse(localStorage.getItem('gallery_meta') || '[]');
        if (Array.isArray(meta) && meta.length) {
          // Convert to same format your gallery state expects (stringified)
          setGallery(meta.map(e => JSON.stringify({ id: e.id, thumb: e.thumb, createdAt: e.createdAt })));
        }
      } catch (err) {
        console.warn("Failed to load gallery_meta:", err);
      }
    }, []);
    
    const closeZoom = () => {
      if (zoomedPage && zoomedPage.startsWith('blob:')) {
        URL.revokeObjectURL(zoomedPage);
      }
      setZoomedPage(null);
    };
        
    useEffect(() => {
      localStorage.setItem("gallery", JSON.stringify(gallery));
    }, [gallery]);
    
    useEffect(() => {
      const restoreSnapshot = async () => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("restore") === "true") {
          const db = await initDB();
          const snap = await db.get('snapshots', 'revertSnapshot');
          if (snap) {
            setContent(snap.prompt || "");
            setSelectedPreset(snap.stylePreset);
            setSelectedStyle(snap.artStyle);
            setSelectedPanelType(snap.panelLayout);
            setPanelCount(PANEL_CONFIG[snap.panelLayout as PanelType]?.panelCount || 3);
            setSelectedColor(snap.colorOption);
            setSelectedMood(snap.moodPreset);
            setIsMangafy(snap.mangafyChecked);
            setUseCustomStyle(snap.customArtStyle || "");
            setCustomStyleDescription(snap.customArtStyle || "");
            setGuidanceScale(snap.guidanceScale);
            setSeedValue(snap.seed);
            console.log("✅ Restored snapshot:", snap);
            await db.delete('snapshots', 'revertSnapshot'); // 🧹 Clean temp snapshot
          }
        }
      };
    
      restoreSnapshot();
    }, []);
    
    
    // -------- IndexedDB helpers --------
function openImageDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("mangaImagesDB", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveImageBlobToDB(id: string, blob: Blob) {
  const db = await openImageDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("images", "readwrite");
    const store = tx.objectStore("images");
    store.put({ id, blob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getImageBlobFromDB(id: string): Promise<Blob | null> {
  const db = await openImageDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("images", "readonly");
    const store = tx.objectStore("images");
    const req = store.get(id);
    req.onsuccess = () => {
      if (!req.result) return resolve(null);
      resolve(req.result.blob as Blob);
    };
    req.onerror = () => reject(req.error);
  });
}

// Convert dataURL to Blob
function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(',');
  const meta = parts[0];
  const base64 = parts[1];
  const mime = meta.match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(base64);
  const len = binary.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
  return new Blob([u8], { type: mime });
}

// Make a small thumbnail (dataURL) from a full-size dataURL
function createThumbnailFromDataUrl(dataUrl: string, maxWidth = 300): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Use jpeg with quality 0.7 to reduce size
      const thumb = canvas.toDataURL('image/jpeg', 0.7);
      resolve(thumb);
    };
    img.onerror = () => resolve(''); // fallback empty
    img.src = dataUrl;
  });
}

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
  
    const downloadAllPages = async () => {
      if (typeof document === "undefined") return;
    
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
      // Helper: apply mood to an image src (dataURL) and return new dataURL
      const bakeMoodToDataUrl = (src: string, mood: MoodType): Promise<string> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const tmp = document.createElement("canvas");
            tmp.width = img.width;
            tmp.height = img.height;
            const tctx = tmp.getContext("2d")!;
            // pick same filter strings as applyMoodEffect
            let filter = "none";
            switch (mood) {
              case "noir":
                filter = "grayscale(100%) contrast(1.3)"; break;
              case "sunset":
                filter = "brightness(1.08) sepia(0.35) hue-rotate(-15deg)"; break;
              case "dramatic":
                filter = "contrast(1.4) brightness(0.92)"; break;
              case "cool":
                filter = "contrast(1.05) hue-rotate(200deg) saturate(1.05)"; break;
              case "warm":
                filter = "brightness(1.04) sepia(0.28) saturate(1.08)"; break;
              case "vintage":
                filter = "sepia(0.55) contrast(1.05) saturate(0.9)"; break;
              case "neon":
                filter = "saturate(1.9) brightness(1.08)"; break;
              case "cinematic":
                filter = "contrast(1.25) brightness(0.96) saturate(0.95)"; break;
              case "none":
              default:
                filter = "none";
            }
            tctx.filter = filter;
            tctx.drawImage(img, 0, 0, tmp.width, tmp.height);
            tctx.filter = "none";
            resolve(tmp.toDataURL("image/png"));
          };
          img.onerror = () => {
            // fallback to src if load fails
            resolve(src);
          };
          img.src = src;
        });
      };
    
      // If no pages generated, try to download visible canvas as a single page (with mood)
      if (!generatedPanels || generatedPanels.length === 0) {
        if (canvasRef.current) {
          const dataUrl = canvasRef.current.toDataURL("image/png");
          if (isIOS) {
            const newWindow = window.open();
            if (newWindow) newWindow.document.write(`<img src="${dataUrl}" style="max-width:100%"/>`);
          } else {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `manga_page_with_mood.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } else {
          alert("No pages available to download.");
        }
        return;
      }
    
      // If no mood selected, preserve existing behaviour (download stored generatedPages)
      if (selectedMood === "none") {
        generatedPanels.forEach((pageData, index) => {
          if (isIOS) {
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
        return;
      }
    
      // Mood selected -> bake mood into each generated page and download
      for (let i = 0; i < generatedPanels.length; i++) {
        const src = generatedPanels[i];
        const bakedDataUrl = await bakeMoodToDataUrl(src, selectedMood);
        if (isIOS) {
          const newWindow = window.open();
          if (newWindow) newWindow.document.write(`<img src="${bakedDataUrl}" style="max-width:100%"/>`);
        } else {
          const link = document.createElement('a');
          link.href = bakedDataUrl;
          link.download = `manga_page_${i + 1}_mood.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        if (i === 0) {
          sessionStorage.setItem('templateImage', LZString.compressToUTF16(bakedDataUrl));
        }
      }
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
  <label>Mood / Lighting Preset:</label>
  <select
    value={selectedMood}
    onChange={(e) => handleMoodChange(e.target.value as MoodType)}
    className={styles.select}
  >
    <option value="none">None</option>
    <option value="noir">Noir</option>
    <option value="sunset">Sunset</option>
    <option value="dramatic">Dramatic Shadows</option>
    <option value="cool">Cool Blue</option>
    <option value="warm">Warm Glow</option>
    <option value="vintage">Vintage</option>
    <option value="neon">Neon Lights</option>
    <option value="cinematic">Cinematic</option>
  </select>
</div>

      <div className={styles.controlGroup}>
{/* Use Custom Art Style */}
<div className="form-group">

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
  <label>Prompt Guide(The lower it is, the closer ai follows the prompt. Recommended 5-8) (1–15) (Optional):</label>
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
  <label>Charcter Conistency(Keep constant for consistent results) (Optional)</label>
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
          <div className={styles.transitionToggle}>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", opacity: canTransition ? 1 : 0.5 }}>
              <input
                type="checkbox"
                checked={canTransition ? transitioning : false}
                disabled={!canTransition}
                onChange={(e) => setTransitioning(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>Transition</div>
                <div style={{ fontSize: 12, lineHeight: 1.35, zIndex:1000 }}>
                On: Panels flow together as one continuous scene.
                Off: Each panel is created as a separate moment.
                </div>
              </div>
            </label>
          </div>
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
    <div>
  <button 
    onClick={handleGenerateManga} 
    className={styles.generateButton}
    disabled={isGenerating}
  >
    <CreditIcon cost={cost} /> 🎨 Generate
  </button>
  <a
    href="/documentation#generate-gallery"
      style={{
        position: "absolute",
        top: "900px",
        left: "13%",
        transform: "translateX(-50%)",
        color: "#ffb347",
        fontWeight: 600,
        textDecoration: "underline",
        fontSize: "0.95rem",
        cursor: "pointer",
        zIndex: 400,
      }}
    >
    New to MangafyAi? Learn how to generate Manga
  </a>
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

<button className={styles.snapshotButton} onClick={handleSnapshotClick}>
  📸
</button>
{showConfirm && (
  <div className={styles.snapshotModal}>
    <p>Save generated image as a snapshot?</p>
    <div className="modalActions">
      <button onClick={confirmSnapshot}>Yes</button>
      <button onClick={() => setShowConfirm(false)}>No</button>
    </div>
  </div>
)}

{showNamePrompt && (
  <div className={styles.snapshotModal}>
    <p>Enter a name for your snapshot:</p>
    <input
      type="text"
      value={snapshotName}
      onChange={(e) => setSnapshotName(e.target.value)}
      placeholder="e.g. Battle Scene v1"
    />
    <button onClick={saveSnapshot}>Save</button>
  </div>
)}

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
      ['--download-top' as any]: '100px',     // desktop top offset
      ['--download-left' as any]: '50%',     // horizontal center
      ['--download-translateX' as any]: '-50%' // default center transform
    }}
  >
    Download All Pages
  </button>

  {/* gallery state now holds JSON-stringified entries or can be parsed before render */}
<div className={styles.gallery}>
  {gallery.map((entryStr, i) => {
    const entry = typeof entryStr === 'string' ? JSON.parse(entryStr) : entryStr;
    return (
      <div key={entry.id} className={styles.galleryItem}>
        {/* show thumbnail from metadata immediately */}
        {entry.thumb ? (
          <img src={entry.thumb} alt={`Saved ${i+1}`} className={styles.galleryThumb} />
        ) : (
          <div className={styles.galleryThumbPlaceholder}>No Thumb</div>
        )}
        <button onClick={async () => {
  const blob = await getImageBlobFromDB(entry.id);
  if (!blob) { alert("Failed to load full image."); return; }
  const url = URL.createObjectURL(blob);
  setZoomedPage(url);
  setZoomedId(entry.id);   // << store the id so delete can find it
}}>Open</button>

      </div>
    );
  })}
</div>

{zoomedPage && (
  <div className={styles.zoomOverlay}>
    <div className={styles.zoomContainer}>
      <img src={zoomedPage} alt="Zoomed Manga Page" className={styles.zoomedImage} />
      {/* ✅ Add delete button below-left of the zoomed image */}
      <div className={styles.zoomActions}>
      <button
  className={styles.deleteZoomBtn}
  onClick={async () => {
    const confirmDelete = window.confirm("Delete this page?");
    if (!confirmDelete) return;
    if (!zoomedId) {
      // defensive: no id available, try best-effort removal by thumbnail match
      console.warn("No zoomedId available; deletion aborted.");
      closeZoom();
      return;
    }

    try {
      // 1) remove blob from IndexedDB
      await deleteImageBlobFromDB(zoomedId);

      // 2) remove from UI gallery state (gallery stores JSON-stringified metadata)
      console.log("prev gallery before filter:", setGallery);
      setGallery(prev => prev.filter(itemStr => {
        try {
          const item = typeof itemStr === 'string' ? JSON.parse(itemStr) : itemStr;
          return item.id !== zoomedId;
        } catch (e) {
          return true; // keep malformed entries
        }
      }));

      // 3) remove from localStorage 'gallery_meta' as well
      try {
        const meta = JSON.parse(localStorage.getItem('gallery_meta') || '[]');
        console.log("meta before filter:", meta);
        const filtered = (Array.isArray(meta) ? meta : []).filter((m: any) => m.id !== zoomedId);
        localStorage.setItem('gallery_meta', JSON.stringify(filtered));
      } catch (err) {
        console.warn("Failed to update gallery_meta in localStorage:", err);
      }

      // 4) revoke url and close zoom
      if (zoomedPage && zoomedPage.startsWith('blob:')) URL.revokeObjectURL(zoomedPage);
      setZoomedPage(null);
      setZoomedId(null);
    } catch (err) {
      console.error("Failed to delete image:", err);
      alert("Failed to delete image. Check console for details.");
    }
  }}
>
  🗑️ Delete
</button>

        <button className={styles.closeZoomBtn} onClick={closeZoom}>Close</button>
      </div>
    </div>
  </div>
)}
</div>
<div>
        <MobileNav /> {/* Only visible on mobile */}
        </div>
  </>
);

  }
  
