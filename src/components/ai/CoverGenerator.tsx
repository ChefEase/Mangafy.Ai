'use client';
import React, { useState } from 'react';
import { aiService } from '@/services/aiService';
import './styles/coverGenerator.css';
import { useCredits } from '@/context/CreditContext'; // Import credit context

const artStyles = {
  'My Hero Academia': `A colorful and action-packed cover with bold linework and sharp highlights. The main character is drawn in the **My Hero Academia** style, with exaggerated expressions and detailed shading. High-energy pose, dynamic perspective, and speed lines in the background. The background is present but not overly detailed.`,
  'Dandadan': `A surreal and highly detailed manga cover in **Dandadan** style. The colors are striking, with dramatic lighting and an eerie, almost chaotic feel. The main character is in a dramatic pose, surrounded by supernatural energy. The background has a mix of realism and abstract shapes.`,
  'Quintessential Quintuplets': `A soft and romantic manga cover in **Quintessential Quintuplets** style. The main character has expressive and delicate facial features with bright, pastel tones. The background is light and warm, giving a dreamy aesthetic. The focus is on the character’s emotions rather than action.`,
  'One Piece': `A bold and vibrant manga cover in **One Piece** style. The characters have expressive, exaggerated features with strong outlines. The background is lively, full of movement and adventure. The scene has a slight comic-like exaggeration, with a fun, action-packed feel.`,
  'Jujutsu Kaisen': `A dark and intense manga cover in **Jujutsu Kaisen** style. The shading is heavy, with deep shadows and a mix of soft and hard highlights. The character is in a battle-ready stance, surrounded by cursed energy effects. The background is moody and atmospheric, adding tension to the scene.`,
  'Tokyo Revengers': `A stylish and modern manga cover in **Tokyo Revengers** style. The colors are semi-muted with a strong focus on street aesthetics. The character is either standing confidently or in a mid-action shot, with a slight blur to add motion. The background is city-themed, resembling gang rivalry settings.`
};

export default function CoverGenerator() {
  const { credits, deductCredits, addCredits } = useCredits(); // Get credit functions
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('My Hero Academia');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null); // Add error state
  const COVER_COST = 10; // Define cover art cost (matches credit system)

  function isBlob(value: any): value is Blob {
    return value && typeof value === 'object' && typeof value.arrayBuffer === 'function';
  }
  
  const generateCover = async () => {
    if (!title.trim()) {
      setError("Please enter a cover description");
      return;
    }

    // Check credits before proceeding
    if (credits < COVER_COST) {
      setError(`You need ${COVER_COST} credits to generate cover art`);
      return;
    }
    setIsGenerating(true);
    setError(null);
    setCoverImage(null);
    try {
         // Deduct credits first
         const deductionSuccess = await deductCredits(COVER_COST);
         if (!deductionSuccess) {
           throw new Error("Credit deduction failed");
         }
      const prompt = `
        Manga cover inspired by **${selectedStyle}**.
        ${artStyles[selectedStyle as keyof typeof artStyles]}
        Scene description: **"${title}"**.
        The title should appear in a **bold, stylized font**.
        High contrast, detailed composition.
      `;

      const imageBlob = await aiService.generateTextToImageFluxDev({
        prompt,
        steps: 50,
        negative_prompt: 'text errors, blurry, watermark, deformed, bad anatomy',
        width: 1024,
        height: 1820,
        guidance_scale: 8.5
      });
  
      let imageUrl: string;
      
      if (isBlob(imageBlob)) {
        imageUrl = URL.createObjectURL(imageBlob);
      } else if (typeof imageBlob === 'string') {
        imageUrl = imageBlob; // URL or base64 string
      } else {
        throw new Error('Unsupported image format');
      }
      
      setCoverImage(imageUrl);
      

    } catch (error: any) {
      console.error('Cover generation error:', error);
      await addCredits(COVER_COST);
      setError(
        error.message || 
        "Cover generation failed. Credits have been refunded. Please try again."
      );
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

      <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)}>
        {Object.keys(artStyles).map((style) => (
          <option key={style} value={style}>
            {style}
          </option>
        ))}
      </select>

      <button 
        onClick={generateCover} 
        disabled={isGenerating || credits < COVER_COST}
        className="generate-button"
      >
        {isGenerating ? (
          'Generating...'
        ) : (
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
