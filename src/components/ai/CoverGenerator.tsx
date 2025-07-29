'use client';
import React, { useState } from 'react';
import { aiService } from '@/services/aiService';
import './styles/coverGenerator.css';
import { useCredits } from '@/context/CreditContext';
import { CharacterService } from '@/services/CharacterService';

const artStyles = {
 'Vinland Saga': `anime, vinland saga art style, dramatic, bold linework, sharp eyes, expressive poses, snowy battlefield, nordic theme, cel-shading, high contrast, dynamic perspective`,
 'The Promised Neverland': `anime, promised neverland art style, cinematic, soft shading, childlike features, eerie atmosphere, candlelight, ruins, deep shadows, symbolic imagery, tension`,
  'Dandadan': `surreal, high-detail, Dandadan art style, dramatic lighting, chaotic atmosphere, supernatural energy, dynamic poses, abstract shapes, vivid color, anime manga`,
  'Quintessential Quintuplets': `soft, romantic, manga cover, Quintessential Quintuplets art style, delicate features, pastel tones, dreamy, warm background, emotional focus, anime romance`,
  'Jujutsu Kaisen': `dark, intense, Jujutsu Kaisen art style, manga cover, heavy shading, deep shadows, battle-ready stance, cursed energy, moody atmosphere, tension, gritty, cinematic anime`,
  'Tokyo Revengers': `stylish, modern, anime manga cover, Tokyo Revengers art style, semi-muted colors, street aesthetic, confident pose, motion blur, city background, gang theme, action shot`,
  'Comic Book (Marvel/DC)': `comic book art style, Marvel, DC Comics, bold lines, dramatic lighting, heroic poses, halftone shading, vibrant color, dynamic action`,
  'Custom Art Style': '', // Placeholder for user-defined styles
};


export default function CoverGenerator() {
  const { credits, deductCredits, addCredits } = useCredits();
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('Vinland Saga');
  const [customStyleText, setCustomStyleText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [negativePrompt, setNegativePrompt] = useState('');
  const COVER_COST = 10;
  const [textOverlay, setTextOverlay] = useState('');
  const [textPosition, setTextPosition] = useState('bottom center');
  const [textColor, setTextColor] = useState('white');
  const [textFont, setTextFont] = useState('serif');


  function isBlob(value: any): value is Blob {
    return value && typeof value === 'object' && typeof value.arrayBuffer === 'function';
  }

  const generateCover = async () => {
    if (!title.trim()) {
      setError("Please enter a cover description");
      return;
    }

    if (credits < COVER_COST) {
      setError(`You need ${COVER_COST} credits to generate cover art`);
      return;
    }

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

      const styleDescription =
        selectedStyle === 'Custom Art Style'
          ? `A manga cover in a unique, user-defined art style: ${customStyleText}`
          : artStyles[selectedStyle as keyof typeof artStyles];

          const prompt = `
          Manga cover in the style of ${selectedStyle}.
          ${styleDescription}
          Scene description: "${processedTitle}".
          Add visible title text: "${textOverlay}".
          Font: ${textFont}, color: ${textColor}, position: ${textPosition}.
          Ensure title text is readable and integrated into the artwork.
          High contrast, detailed composition.
        `;

      const imageBlob = await aiService.generateTextToImageFluxDev({
        prompt,
        steps: 50,
        negative_prompt: negativePrompt || "text errors, blurry, watermark, deformed, bad anatomy",
        width: 1008,
        height: 1792,
        guidance_scale: 13.5
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
      console.error('Cover generation error:', error);
      if (creditsWereDeducted) await addCredits(COVER_COST);
      setError(error.message || "Cover generation failed. Credits refunded. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCover = () => {
    if (!coverImage) return;
    const link = document.createElement('a');
    link.href = coverImage;
    link.download = `generated_cover.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="cover-generator">
      {error && <div className="error-message">{error}</div>}

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Describe the cover scene..."
      />

      <input
        type="text"
        value={negativePrompt}
        onChange={(e) => setNegativePrompt(e.target.value)}
        placeholder="Negative prompt keywords (e.g. Luffy, watermark)"
        className="negative-prompt-input"
      />

      <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)}>
        {Object.keys(artStyles).map((style) => (
          <option key={style} value={style}>
            {style}
          </option>
        ))}
      </select>

      {selectedStyle === 'Custom Art Style' && (
        <input
          type="text"
          value={customStyleText}
          onChange={(e) => setCustomStyleText(e.target.value)}
          placeholder="Describe your custom art style"
          className="custom-style-input"
        />
      )}
  <input
        type="text"
        value={textOverlay}
        onChange={(e) => setTextOverlay(e.target.value)}
        placeholder="Text to appear on the cover (e.g. The Crimson Blade)"
        className="text-overlay-input"
      />

      <div className="form-group">
        <label>Text Position</label>
        <select value={textPosition} onChange={(e) => setTextPosition(e.target.value)}>
          <option value="top left">Top Left</option>
          <option value="top center">Top Center</option>
          <option value="top right">Top Right</option>
          <option value="bottom left">Bottom Left</option>
          <option value="bottom center">Bottom Center</option>
          <option value="bottom right">Bottom Right</option>
        </select>
      </div>

      <div className="form-group">
        <label>Text Font</label>
        <select value={textFont} onChange={(e) => setTextFont(e.target.value)}>
          <option value="serif">Serif</option>
          <option value="sans-serif">Sans-serif</option>
          <option value="handwritten">Handwritten</option>
          <option value="fantasy">Fantasy</option>
          <option value="gothic">Gothic</option>
        </select>
      </div>

      <div className="form-group">
        <label>Text Color</label>
        <select value={textColor} onChange={(e) => setTextColor(e.target.value)}>
          <option value="white">White</option>
          <option value="black">Black</option>
          <option value="red">Red</option>
          <option value="yellow">Yellow</option>
          <option value="blue">Blue</option>
        </select>
      </div>
      
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
        <div className="cover-result">
          <img src={coverImage} alt="Generated cover art" />
          <button onClick={downloadCover}>Download Cover</button>
        </div>
      )}
    </div>
  );
}
