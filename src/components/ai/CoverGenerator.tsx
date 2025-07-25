'use client';
import React, { useState } from 'react';
import { aiService } from '@/services/aiService';
import './styles/coverGenerator.css';
import { useCredits } from '@/context/CreditContext';
import { CharacterService } from '@/services/CharacterService';

const artStyles = {
  'Vinland Saga': `A gritty and anime manga cover inspired by **Vinland Saga**. The characters are depicted with serious emotion, very good proportions, and detailed linework. The background often shows a historical or Nordic war setting with muted, earthy tones. The shading is dramatic and moody, evoking a sense of conflict or survival.`,
  'The Promised Neverland': `A cinematic manga cover inspired by **The Promised Neverland**. Characters are illustrated with delicate, childlike features and soft, painterly shading, emphasizing their innocence. The background contrasts this with a dark, unsettling atmosphere — overgrown ruins, dim candlelight, looming silhouettes, or abstract, symbolic imagery (e.g., clocks, cages, wings). Lighting is moody and low-key, with deep shadows and subtle rim highlights. The composition evokes tension, mystery, and quiet dread, blending beauty with a sense of danger and foreboding.`,
  'Dandadan': `A surreal and highly detailed anime manga cover in **Dandadan** style. The colors are striking, with dramatic lighting and an eerie, almost chaotic feel. The characters are drawn in a dramatic pose, surrounded by supernatural energy. The background has a mix of anime and abstract shapes.`,
  'Quintessential Quintuplets': `A soft and romantic manga cover in **Quintessential Quintuplets** style. The characters have expressive and delicate facial features with bright, pastel tones. The background is light and warm, giving a dreamy aesthetic. The focus is on the character’s emotions rather than action.`,
  'Jujutsu Kaisen': `A dark and intense manga cover in **Jujutsu Kaisen** style. The shading is heavy, with deep shadows and a mix of soft and hard highlights. The characters are in a battle-ready stance, surrounded by cursed energy effects. The background is moody and atmospheric, adding tension to the scene.`,
  'Tokyo Revengers': `A stylish and modern anime manga cover in **Tokyo Revengers** style. The colors are semi-muted with a strong focus on street aesthetics. The characters haave either standing confidently or in a mid-action shot, with a slight blur to add motion. The background is city-themed, resembling gang rivalry settings.`,
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
        Manga cover inspired by **${selectedStyle}**.
        ${styleDescription}
        Scene description: **"${processedTitle}"**.
        The title should appear in a **bold, stylized font**.
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
