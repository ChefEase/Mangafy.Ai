'use client';
import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '@/services/aiService';
import { useCredits } from '@/context/CreditContext';
import { CharacterService } from '@/services/CharacterService';
import './styles/coverGenerator.css';
import {enforceNoDialogueAndStyle} from '@/utils/promptUtils'

const artStyles = {
  'Vinland Saga': `vinland saga art style, dramatic, bold linework, sharp eyes, cel-shading, high contrast, dynamic perspective`,
  'The Promised Neverland': `The promised neverland art style, cinematic, soft shading,`,
  'Dandadan': `surreal, high-detail, Dandadan art style, vivid color,`,
  'Quintessential Quintuplets': `soft, romantic, Quintessential Quintuplets art style, delicate features,`,
  'Jujutsu Kaisen': `dark, intense, Jujutsu Kaisen art style, heavy shading, deep shadows, cinematic`,
  'Tokyo Revengers': `Tokyo Revengers art style, motion blur, gang theme,`,
  'One Piece': `vibrant color, One Piece art style, exaggerated expressions, cel-shaded,`,
  'My Hero Academia': `bold linework, My Hero Academia art style, sharp cel-shading, comic-style motion lines, dramatic angles,`,
  'Bleach': `cool-toned, spiritual, Bleach art style, sharp eyes, flowing clothing, detailed hair, ethereal effects, manga-style linework`,
  'Chainsaw Man': `gritty, Chainsaw Man art style, intense contrast, sharp shading, cinematic`,
  'Comic Book (Marvel/DC)': `American comic book art style, bold lines, halftone shading, vibrant color,`,
  'Custom Art Style': '',
};

const textEffects = ['None', 'Shadow', 'Stroke', '3D'];
const advancedTextOptions = ['Graffiti', 'Neon Glow', 'Manga SFX', 'Cyberpunk Glitch', 'Ancient Runes'];
const fontOptions = [
  'Comic Sans MS', 'Bangers', 'Luckiest Guy', 'Fredoka One', 'Chewy', 'Indie Flower', 'Permanent Marker', 'Baloo 2', 'Boogaloo', 'Bubblegum Sans', 'Rubik Wet Paint',
  'Impact', 'Oswald', 'Bebas Neue', 'Anton', 'Archivo Black', 'Montserrat', 'Titillium Web', 'Russo One', 'Black Ops One', 'League Spartan',
  'Pacifico', 'Lobster', 'Amatic SC', 'Satisfy', 'Great Vibes', 'Shadows Into Light', 'Dancing Script', 'Caveat', 'Gloria Hallelujah', 'Abril Fatface'
];

export default function CoverGenerator() {
  const { credits, deductCredits, addCredits } = useCredits();
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('Vinland Saga');
  const [customStyleText, setCustomStyleText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [negativePrompt, setNegativePrompt] = useState('');

  const [textOverlay, setTextOverlay] = useState('');
  const [textPosition, setTextPosition] = useState('bottom center');
  const [textColor, setTextColor] = useState('white');
  const [textFont, setTextFont] = useState('Comic Sans MS');
  const [advancedText, setAdvancedText] = useState(false);
  const [advancedTextStyle, setAdvancedTextStyle] = useState('Graffiti');
  const [textEffect, setTextEffect] = useState('None');
  const [fontSize, setFontSize] = useState(60);
  const [textRotation, setTextRotation] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const COVER_COST = 10;

  function isBlob(value: any): value is Blob {
    return value && typeof value === 'object' && typeof value.arrayBuffer === 'function';
  }

  const generateCover = async () => { 
    if (!title.trim()) return setError("Please enter a cover description");
    if (credits < COVER_COST) return setError(`You need ${COVER_COST} credits to generate cover art`);
  
    setIsGenerating(true);
    setError(null);
    setCoverImage(null);
    let creditsWereDeducted = false;
  
    try {
      const deductionSuccess = await deductCredits(COVER_COST);
      if (!deductionSuccess) throw new Error("Credit deduction failed");
      creditsWereDeducted = true;
  
      const characters = await CharacterService.getCharacters();
      const processedTitle = characters.reduce((acc, character) => {
        const regex = new RegExp(`\\b${character.name}\\b`, 'gi');
        return acc.replace(regex, character.description);
      }, title);
  
      const styleDescription = selectedStyle === 'Custom Art Style'
        ? `A manga cover in a unique, user-defined art style: ${customStyleText}`
        : artStyles[selectedStyle as keyof typeof artStyles];
  
      const stylePrompt = selectedStyle === 'Custom Art Style' 
        ? customStyleText 
        : selectedStyle;
  
      const promptForCompression = `${stylePrompt}, ${processedTitle}`;
      let compressedPrompt = await aiService.compressPrompt(promptForCompression);
      compressedPrompt = enforceNoDialogueAndStyle(compressedPrompt, stylePrompt);
  
      let seed: number;
    const storedSeed = localStorage.getItem("lastSeed");
    if (storedSeed) {
      seed = parseInt(storedSeed, 10);
    } else {
      seed = Math.floor(Math.random() * 10_000_000);
      localStorage.setItem("lastSeed", seed.toString());
    }

      const imageBlob = await aiService.generateTextToImageReplicate({
        prompt: compressedPrompt,
        negative_prompt: negativePrompt || "text errors, blurry, watermark, deformed, bad anatomy",
        width: 1008,
        height: 1792,
        cfg_scale: 7,
        steps: 28,
        seed,
        style_selector: "Anime",
      });
  
      let imageUrl: string;
      if (isBlob(imageBlob)) {
        imageUrl = URL.createObjectURL(imageBlob);
      } else if (typeof imageBlob === 'string') {
        imageUrl = imageBlob;
      } else {
        throw new Error('Unsupported image format');
      }
  
      setCoverImage(imageUrl);
    } catch (error: any) {
      if (creditsWereDeducted) await addCredits(COVER_COST);
      setError(error.message || "Cover generation failed. Credits refunded. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !coverImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = new Image();
    image.src = coverImage;
    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      if (!textOverlay) return;
const lines = textOverlay.split('\n');
    let size = fontSize;
    ctx.textAlign = textPosition.includes('left') ? 'left' : textPosition.includes('right') ? 'right' : 'center';
    ctx.textBaseline = 'top'; // So we can adjust Y more precisely
  
    // Set font to check heights
    ctx.font = `${size}px '${textFont}', sans-serif`;
    const lineHeight = size + 10;
    const totalHeight = lines.length * lineHeight;
  
    // Calculate Y based on vertical alignment
    let y = 0;
    if (textPosition.includes('top')) {
      y = 40;
    } else if (textPosition.includes('bottom')) {
      y = canvas.height - totalHeight - 40;
    } else {
      y = (canvas.height - totalHeight) / 2;
    }
  
    // Calculate X based on alignment
    const calcX = () => {
      if (textPosition.includes('left')) return 40;
      if (textPosition.includes('right')) return canvas.width - 40;
      return canvas.width / 2;
    };
    const x = calcX();
  
    // Inside drawCanvas()

lines.forEach((line, i) => {
  const finalLine = line;
  if (advancedText && advancedTextStyle === 'Manga SFX') {
  const chars = finalLine.split('');

  const canvasW = canvas.width;
  const canvasH = canvas.height;

  // Respect textPosition
  let centerX = canvasW / 2;
  if (textPosition.includes('left')) centerX = 200;
  if (textPosition.includes('right')) centerX = canvasW - 200;

  let baseY = canvasH / 2;
  if (textPosition.includes('top')) baseY = 250;
  if (textPosition.includes('bottom')) baseY = canvasH - 250;

  const arcHeight = 200;

  let totalWidth = 0;
  const scales: number[] = [];

  for (let i = 0; i < chars.length; i++) {
    const scale = 0.8 + (i / chars.length) * 1.2;
    scales.push(scale);
    ctx.font = `bold ${fontSize * scale}px '${textFont}', sans-serif`;
    totalWidth += ctx.measureText(chars[i]).width;
  }

  let offsetX = centerX - totalWidth / 2;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const scale = scales[i];
    ctx.font = `bold ${fontSize * scale}px '${textFont}', sans-serif`;
    const charWidth = ctx.measureText(char).width;

    const percent = i / (chars.length - 1 || 1);
    const angle = Math.PI * percent;
    const y = baseY - Math.sin(angle) * arcHeight;
    const x = offsetX;

    ctx.save();
    ctx.translate(x + charWidth / 2, y);
    ctx.rotate((angle - Math.PI / 2) * 0.5);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'white';
    ctx.strokeText(char, 0, 0);
    ctx.fillStyle = textColor;
    ctx.fillText(char, 0, 0);
    ctx.restore();

    offsetX += charWidth;
  }

  return; // ✅ skip default text drawing
}

  let currentSize = size;
  ctx.font = `${currentSize}px '${textFont}', sans-serif`;
  let textWidth = ctx.measureText(line).width;
  const maxWidth = canvas.width - 80;

  if (textWidth > maxWidth) {
    const scale = maxWidth / textWidth;
    currentSize = Math.floor(currentSize * scale);
    ctx.font = `${currentSize}px '${textFont}', sans-serif`;
  }

  const lineY = y + i * (currentSize + 10);

  ctx.save();
  ctx.translate(x, lineY);
  ctx.rotate((textRotation * Math.PI) / 180);
  ctx.textAlign = textPosition.includes('left') ? 'left' :
                  textPosition.includes('right') ? 'right' : 'center';

  // Standard effects
  if (textEffect === 'Shadow') {
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
  }

  if (textEffect === '3D') {
    for (let j = 0; j < 5; j++) {
      ctx.fillStyle = 'black';
      ctx.fillText(finalLine, j, j);
    }
  }

  if (textEffect === 'Stroke') {
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'black';
    ctx.strokeText(finalLine, 0, 0);
  }

  // Advanced effects
  if (advancedText) {
    switch (advancedTextStyle) {
      case 'Neon Glow':
        ctx.shadowColor = textColor;
        ctx.shadowBlur = 50;
        ctx.lineWidth = 2;
        ctx.strokeStyle = textColor;
        ctx.strokeText(finalLine, 0, 0);
        break;
    
      case 'Graffiti':
        ctx.save();
        ctx.rotate(-0.05);
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.strokeText(finalLine, 0, 0);
        ctx.fillStyle = textColor;
        ctx.fillText(finalLine, 0, 0);
        ctx.restore();
        break;
    
        case 'Manga SFX': {
          const chars = finalLine.split('');
        
          const canvasW = canvas.width;
          const canvasH = canvas.height;
        
          let centerX = canvasW / 2;
          if (textPosition.includes('left')) centerX = 200;
          if (textPosition.includes('right')) centerX = canvasW - 200;
        
          let baseY = canvasH / 2;
          if (textPosition.includes('top')) baseY = 250;
          if (textPosition.includes('bottom')) baseY = canvasH - 250;
        
          const arcHeight = 200;
        
          let totalWidth = 0;
          const scales: number[] = [];
        
          for (let i = 0; i < chars.length; i++) {
            const scale = 0.8 + (i / chars.length) * 1.2;
            scales.push(scale);
            ctx.font = `bold ${fontSize * scale}px '${textFont}', sans-serif`;
            totalWidth += ctx.measureText(chars[i]).width;
          }
        
          let offsetX = centerX - totalWidth / 2;
        
          for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            const scale = scales[i];
            ctx.font = `bold ${fontSize * scale}px '${textFont}', sans-serif`;
            const charWidth = ctx.measureText(char).width;
        
            const percent = i / (chars.length - 1 || 1);
            const angle = Math.PI * percent;
            const y = baseY - Math.sin(angle) * arcHeight;
            const x = offsetX;
        
            ctx.save();
            ctx.translate(x + charWidth / 2, y);
            ctx.rotate((angle - Math.PI / 2) * 0.5);
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'white';
            ctx.strokeText(char, 0, 0);
            ctx.fillStyle = textColor;
            ctx.fillText(char, 0, 0);
            ctx.restore();
        
            offsetX += charWidth;
          }
        
          return;
        }
            case 'Cyberpunk Glitch': {
          const jitter = 2 + Math.random() * 2;
          ctx.save();
        
          // Horizontal RGB channel split
          ctx.fillStyle = 'magenta';
          ctx.fillText(finalLine, -jitter, -1);
          ctx.fillStyle = 'cyan';
          ctx.fillText(finalLine, jitter, 1);
          ctx.fillStyle = 'lime';
          ctx.fillText(finalLine, 0, jitter * 0.5);
        
          // Main text
          ctx.shadowColor = '#0ff';
          ctx.shadowBlur = 12;
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = textColor;
          ctx.fillText(finalLine, 0, 0);
        
          // Glitch slices
          for (let i = 0; i < 3; i++) {
            const sliceY = Math.random() * currentSize;
            const sliceHeight = 4 + Math.random() * 6;
            const offset = (Math.random() - 0.5) * 10;
        
            ctx.save();
            ctx.beginPath();
            ctx.rect(-200, sliceY, 400, sliceHeight);
            ctx.clip();
            ctx.translate(offset, 0);
            ctx.fillText(finalLine, 0, 0);
            ctx.restore();
          }
        
          ctx.restore();
          break;
        }
        
    
      case 'Ancient Runes':
        ctx.save();
        ctx.rotate(-0.08);
        ctx.fillStyle = '#228B22'; // forest green
        ctx.shadowColor = '#013220';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'darkgreen';
        ctx.strokeText(finalLine, 0, 0);
        ctx.fillText(finalLine, 0, 0);
        ctx.font = `20px sans-serif`;
        ctx.fillText('ᚠ', -currentSize / 2, 20); // basic rune glyph
        ctx.restore();
        break;
    }
  }

  ctx.fillStyle = textColor;
  ctx.fillText(finalLine, 0, 0);
  ctx.restore();

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
});
        };
  };

 useEffect(() => {
  if (!coverImage) return;
    drawCanvas();
}, [coverImage, textOverlay, textEffect, advancedText, advancedTextStyle, textFont, textRotation, textColor, textPosition, fontSize]);

const downloadCover = async () => {
  if (!canvasRef.current) return;

  const dataUrl = canvasRef.current.toDataURL("image/png");
  
  // iOS / Mobile Safari fix → use the Web Share API if available
  if (navigator.share) {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], "generated_cover.png", { type: "image/png" });

      await navigator.share({
        title: "Generated Cover",
        files: [file],
      });
      return;
    } catch (err) {
      console.error("Sharing failed, falling back:", err);
    }
  }

  // Fallback for desktop and unsupported devices
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "generated_cover.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  return (
    <div className="cover-generator">
      {error && <div className="error-message">{error}</div>}

      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Describe the cover scene..." />
      <input value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="Negative keywords (optional)" className="negative-prompt-input" />

      <label>
        Art Style
      <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)}>
        {Object.keys(artStyles).map((style) => (
          <option key={style} value={style}>{style}</option>
        ))}
      </select>
      </label>
      {selectedStyle === 'Custom Art Style' && (
        <input value={customStyleText} onChange={(e) => setCustomStyleText(e.target.value)} placeholder="Describe your custom style" />
      )}

<button
        onClick={generateCover}
        disabled={isGenerating || credits < COVER_COST}
        className="generate-button"
      >
        {isGenerating ? 'Generating...' : (
          <>
            Generate Cover Art <span className="credit-cost">{COVER_COST}</span>
            <img src="/credit-icon.png" alt="Credits" className="credit-icon" />
          </>
        )}
      </button>


      {coverImage && (
        <div className="cover-preview-wrapper" style={{ marginTop: '2rem' }}>
         <canvas ref={canvasRef} className="cover-canvas" />
          <div className="text-editor-panel">
          <label>
            Overlay Text
            <textarea
              className="modern-textarea"
              rows={3}
              value={textOverlay}
              onChange={(e) => setTextOverlay(e.target.value)}
              placeholder="Enter overlay text"
            />
          </label>

          <label>
            Text Position
            <select value={textPosition} onChange={(e) => setTextPosition(e.target.value)}>
              <option value="top left">Top Left</option>
              <option value="top center">Top Center</option>
              <option value="top right">Top Right</option>
              <option value="bottom left">Bottom Left</option>
              <option value="bottom center">Bottom Center</option>
              <option value="bottom right">Bottom Right</option>
            </select>
            </label>

            <label>
              Text Font
            <select value={textFont} onChange={(e) => setTextFont(e.target.value)}>
            {fontOptions.map(font => (
    <option key={font} value={font} style={{ fontFamily: font }}>
      {font}
    </option>
  ))}
            </select>
            </label>
            <label>Font Size: <input type="range" min="50" max="200" value={fontSize} onChange={(e) => setFontSize(+e.target.value)} /></label>
            <label>Rotation: <input type="range" min={-45} max={45} value={textRotation} onChange={(e) => setTextRotation(+e.target.value)} /></label>

            <label>
              Text Color
            <select value={textColor} onChange={(e) => setTextColor(e.target.value)}>
              <option value="white">White</option>
              <option value="black">Black</option>
              <option value="red">Red</option>
              <option value="yellow">Yellow</option>
              <option value="blue">Blue</option>
            </select>
            </label>

            <label>
              Text Effect
            <select value={textEffect} onChange={(e) => setTextEffect(e.target.value)}>
              {textEffects.map(effect => <option key={effect} value={effect}>{effect}</option>)}
            </select>
            </label>
            <label>
              <input type="checkbox" checked={advancedText} onChange={() => setAdvancedText(!advancedText)} /> 
              Advanced Effect: On     
            </label>

            <label>
            {advancedText && (
              <select value={advancedTextStyle} onChange={(e) => setAdvancedTextStyle(e.target.value)}>
                {advancedTextOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            )}
            </label>
            <button onClick={downloadCover}>Download</button>
          </div>
        </div>
      )}
    </div>
  );
}
