'use client';
import React, { useState, useRef } from 'react';
import { aiService } from '../../services/aiService';
import Image from 'next/image';
import './styles/CharacterGenerator.css';
import { useCredits } from '@/context/CreditContext'; // Add this import
import MobileNav from "../../components/ScriptEditor/MobileNav"

export default function CharacterGenerator() {
  const { credits, deductCredits, addCredits } = useCredits(); // Get credit functions
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [params, setParams] = useState({
    prompt: '',
    negative_prompt: 'nsfw, text, deformed, mutated, worst quality, deformed hands, deformed body parts',
    textStyle: 'anime',
    imageStyle: 'Ghibli',
    guidance_scale: 13.5,
    num_inference_steps: 35,
    seed: 42,
    width: 1024,
    height: 1816,
  });
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null); // Add error state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const CHARACTER_COST = 10; // Define character generation cost
  const [isReferenceSheet, setIsReferenceSheet] = useState(false);
const REFERENCE_SHEET_COST = 30;

const getStylePrompt = (style: string) => {
  const styles = {
    vinlandSaga: 'Vinland Saga Art style, detailed clothing, expressive face,',
    promisedNeverland: 'Promised Neverland Art style, soft lines, large expressive eyes,',
    dandadan: 'Dandadan Art style, sharp features, intricate supernatural designs,',
    quintessentialQuintuplets: 'Quintessential Quintuplets Art style, soft shading,',
    jujutsuKaisen: 'Jujutsu Kaisen Art style, edgy linework,',
    tokyoRevengers: 'Tokyo Revengers Art style, sharp and clean line art, street-style tone',
    onePiece: 'One Piece Art style,',
    myHeroAcademia: 'My Hero Academia Art style, clean shading,',
    bleach: 'Bleach Art style, sleek designs, dramatic contrasts,',
    chainsawMan: 'Chainsaw Man Art style, sketchy linework,',
    comicBook: 'American comic book style (Marvel/DC), bold outlines,',
    waifu: 'Waifu, medium breast, wide hips, medium ass, ultra-polished anime look, big sparkly eyes, glossy hair,',
    swordArtOnline: 'Sword Art Online Art style, sleek character designs, glowing digital effects,',
    naruto: 'Naruto Art style, sharp angular features,',
    dragonBall: 'Dragon Ball Art style,',
    reZero: 'Re:Zero Art style, detailed clothing,'
  };        
  return styles[style as keyof typeof styles] || '';
};

// Add this near the top of CharacterGenerator (outside component)
const artStylePreviews: Record<string, [string, string]> = {
  vinlandSaga: ["/samples/vinlandsaga1.png", "/samples/vinlandsaga2.png"],
  promisedNeverland: ["/samples/promised1.png", "/samples/promised2.png"],
  dandadan: ["/samples/dandadan1.png", "/samples/dandadan2.png"],
  quintessentialQuintuplets: ["/samples/quint1.jpeg", "/samples/quint2.png"],
  jujutsuKaisen: ["/samples/jujutsukaisen1.png", "/samples/jujutsukaisen2.png"],
  tokyoRevengers: ["/samples/revengers1.png", "/samples/revengers2.png"],
  onePiece: ["/samples/onepiece.jpg", "/samples/onepiece2.png"],
  myHeroAcademia: ["/samples/MHA1.png", "/samples/MHA2.png"],
  bleach: ["/samples/bleach1.png", "/samples/bleach2.png"],
  chainsawMan: ["/samples/chainsawman1.png", "/samples/chainsawman2.png"],
  comicBook: ["/samples/comic1.png", "/samples/comic2.png"],
  waifu: ["/samples/waifu1.png", "/samples/waifu2.png"],
  swordArtOnline: ["/samples/SAO1.png", "/samples/SAO2.png"],
  naruto: ["/samples/naruto1.png", "/samples/naruto2.png"],
  dragonBall: ["/samples/dbz1.png", "/samples/dbz2.png"],
  reZero: ["/samples/rezero1.png", "/samples/rezero2.png"],
};

  const generateCharacter = async () => {
    setIsGenerating(true);
    setError(null);
    // Check credits before proceeding
    let creditsDeducted = false; // 👈 Track if we deducted

    const cost = isReferenceSheet ? REFERENCE_SHEET_COST : CHARACTER_COST;

    if (credits < cost) {
      setError(`You need ${cost} credits to generate a character`);
      setIsGenerating(false);
      return;
    }
    try {
      if (mode === "text") {
        const seed = Math.floor(Math.random() * 2_000_000) + 1;
        const styleText = getStylePrompt(params.textStyle).trim().replace(/,$/, '');
        if (isReferenceSheet) {
          // ✅ Generate front, side, back with SAME SEED
          const basePrompt = `${params.prompt ? params.prompt + ', ' : ''}${styleText}, high quality character design, white background, standing, no objects, no shadows, no clouds, no designs, no patterns, solo`;

          const views = [
            `${basePrompt}, front view`,
            `${basePrompt}, side view`,
            `${basePrompt}, back view`
          ];
          const negativePrompt = `${params.negative_prompt}  background objects, scenery, patterns, textures, floor, wall, furniture, landscape`
          const results: string[] = [];
  
          for (let view of views) {
            const blob = await aiService.generateTextToImageReplicate({
              prompt: view,
              negative_prompt: negativePrompt,
              width: params.width,
              height: params.height,
              cfg_scale: 7,
              steps: 28,
              seed, // ✅ SAME SEED for consistency
              style_selector: "Anime"
            });
            const url = URL.createObjectURL(blob);
            results.push(url);
          }
  
          const deductionSuccess = await deductCredits(cost);
          if (!deductionSuccess) throw new Error("Credit deduction failed");
          creditsDeducted = true;
  
          setGeneratedImage(results.join("|")); // Store joined
          setIsGenerating(false);
        } else {
          // ✅ Normal single image generation
          const fullPrompt = `${params.prompt ? params.prompt + ', ' : ''}${styleText}, white background, high quality character design`;
          const blob = await aiService.generateTextToImageReplicate({
            prompt: fullPrompt,
            negative_prompt: params.negative_prompt,
            width: params.width,
            height: params.height,
            cfg_scale: 7,
            steps: 28,
            seed: Math.floor(Math.random() * 2_000_000) + 1,
            style_selector: "Anime"
          });
          const imageUrl = URL.createObjectURL(blob);
  
          const deductionSuccess = await deductCredits(cost);
          if (!deductionSuccess) throw new Error("Credit deduction failed");
          creditsDeducted = true;
  
          setGeneratedImage(imageUrl);
          setIsGenerating(false);
        }
      } else {
        // ✅ IMAGE-TO-IMAGE — UPDATED TO USE /api/generate-image
        if (!referenceImage) throw new Error("Please upload a reference image");

        setIsGenerating(true); // ✅ Show loading immediately
        console.log("Sending POST request to /api/generate-image with formData");

          const formData = new FormData();
          formData.append("prompt", params.prompt);
          formData.append("guidance_scale", params.guidance_scale.toString());
          formData.append("num_inference_steps", params.num_inference_steps.toString());
          formData.append("seed", params.seed.toString());
          if (referenceImage) {
            formData.append("image", referenceImage);
          }
  
  const res = await fetch("/api/generate-image", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.text(); // try to parse plain error
    throw new Error(error || "Image generation failed");
  }

  const blob = await res.blob();
  const imageUrl = URL.createObjectURL(blob);
  console.log("👉 Full response data:", blob);
  console.log("Reference image before sending:", referenceImage);

  const deductionSuccess = await deductCredits(CHARACTER_COST);
  if (!deductionSuccess) {
    throw new Error("Credit deduction failed");
  }
  creditsDeducted = true; // ✅ TRACK IT HERE
  setGeneratedImage(imageUrl);

  console.log(blob); // 👀 check structure
  console.log("typeof blob:", typeof blob);
      }
  
    } catch (err: any) {
      if (creditsDeducted) await addCredits(isReferenceSheet ? REFERENCE_SHEET_COST : CHARACTER_COST);
      const isTooLarge = err.message?.toLowerCase().includes("entity too large") || 
                     err.message?.toLowerCase().includes("function_payload_too_large");

  // Show user-friendly error message
  setError(isTooLarge 
    ? "The image you uploaded is too large. Please upload a smaller image (try under 4MB)." 
    : err.message || "Generation failed. Credits have been refunded. Please try again."
  );
    
      console.error("Generation error:", err);
      
      alert("Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
    }
  };

  const downloadImage = async () => {
    if (!generatedImage) return;
  
    const urls = generatedImage.includes("|") ? generatedImage.split("|") : [generatedImage];
  
    // Detect device type
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isMobile = isIOS || isAndroid;
  
    if (isIOS && navigator.share) {
      // iOS Web Share
      try {
        const files = await Promise.all(
          urls.map(async (url, idx) => {
            const response = await fetch(url);
            const blob = await response.blob();
            return new File([blob], `character_${idx}_${Date.now()}.png`, { type: "image/png" });
          })
        );
        await navigator.share({ title: "My Character", files });
        return;
      } catch (err) {
        console.warn("iOS Web Share failed, falling back to desktop download:", err);
      }
    }
  
    // Desktop / Android / fallback
    for (let idx = 0; idx < urls.length; idx++) {
      try {
        const response = await fetch(urls[idx]);
        const blob = await response.blob();
        const file = new File([blob], `character_${idx}_${Date.now()}.png`, { type: "image/png" });
  
        if (isAndroid && navigator.share) {
          // Optional: Android Web Share
          try {
            await navigator.share({ title: "My Character", files: [file] });
            continue;
          } catch {
            // fallback to download
          }
        }
  
        // Desktop / fallback download
        const link = document.createElement("a");
        link.href = URL.createObjectURL(file);
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
  
      } catch (err) {
        console.error("Failed to fetch generated image:", err);
      }
    }
  };
  
  
  return (
    <div className="character-generator">
      <div className="mode-selector">
        <button 
          className={mode === 'text' ? 'active' : ''}
          onClick={() => setMode('text')}
        >
          Text to Image
        </button>
        <button
          className={mode === 'image' ? 'active' : ''}
          onClick={() => setMode('image')}
        >
          Image to Image
        </button>
      </div>
      <div className="generation-form">
      {mode === 'text' && (
        <>
  <div className="form-group">
    <label>Art Style</label>
    <select
      value={params.textStyle}
      onChange={(e) => setParams({...params, textStyle: e.target.value})}
    >
<option value="vinlandSaga">Vinland Saga</option>
<option value="promisedNeverland">Promised Neverland</option>
<option value="dandadan">Dandadan</option>
<option value="quintessentialQuintuplets">Quintessential Quintuplets</option>
<option value="jujutsuKaisen">Jujutsu Kaisen</option>
<option value="tokyoRevengers">Tokyo Revengers</option>
<option value="onePiece">One Piece</option>
<option value="myHeroAcademia">My Hero Academia</option>
<option value="bleach">Bleach</option>
<option value="chainsawMan">Chainsaw Man</option>
<option value="comicBook">Comic Book (DC/Marvel)</option> 
<option value="waifu">Waifu</option>
<option value="swordArtOnline">Sword Art Online</option> 
<option value="naruto">Naruto</option> 
<option value="dragonBall">Dragon Ball</option> 
<option value="reZero">Re:Zero</option> 

    </select>
  </div>

{/* Art Style Preview */}
<div className="artstyle-preview">
  <label>Preview of Art Style</label>
  <div className="preview-images">
    {artStylePreviews[params.textStyle]?.map((src, idx) => (
      <img key={idx} src={src} alt={`Preview ${idx + 1}`} className="preview-img" />
    ))}
  </div>
</div>

    <div className="form-group">
      <label>
        <input
          type="checkbox"
          checked={isReferenceSheet}
          onChange={(e) => setIsReferenceSheet(e.target.checked)}
        />
        Generate Character Reference Sheet (Front / Side / Back)
      </label>
    </div>
    </>
)}
        {mode === 'image' && (
          <div>
            <div className="image-upload">
                <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                hidden
            />
            
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="upload-button"
            >
                {referenceImage ? 'Change Reference' : 'Upload Reference Image'}
            </button>
    
                {referenceImage && (
            <div className="preview-comparison">
                <div className="preview-item">
                <h4>Original</h4>
                    <img 
                        src={URL.createObjectURL(referenceImage)} 
                        alt="Reference preview" 
                        className="preview"
                    />
                  </div>
                  {generatedImage && (
                    <div className="preview-item">
                      <h4>Generated</h4>
                      <img
                        src={generatedImage}
                        alt="Generated result"
                        className="preview"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Character Description</label>
          <textarea
            value={params.prompt}
            onChange={(e) => setParams({...params, prompt: e.target.value})}
            placeholder="Describe your character (e.g. 'Young elf warrior with green armor')"
            rows={3}
          />
        </div>

        <div className="params-grid">
          {mode === 'image' && (
            <>
              <div className="form-group">
                <label>Guidance Scale</label>
                <input
                  type="range"
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={params.guidance_scale}
                  onChange={(e) => {
                    setParams({ ...params, guidance_scale: parseFloat(e.target.value) })
                  }}
                />
                <span>{params.guidance_scale.toFixed(1)}</span>
              </div>

              <div className="form-group">
                <label>Inference Steps</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={params.num_inference_steps}
                  onChange={(e) => {
                    setParams({ ...params, num_inference_steps: parseInt(e.target.value) })
                  }}
                />
                <span>{params.num_inference_steps}</span>
              </div>

              <div className="form-group">
                <label>Seed</label>
                <input
                  type="range"
                  min="1"
                  max="21000000"
                  value={params.seed}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    console.log('Seed changed:', value);
                    setParams({ ...params, seed: value });
                  }}
                />
                <span>{params.seed}</span>
              </div>
            </>
          )}
        </div>

        <button 
          onClick={generateCharacter} 
          disabled={isGenerating || credits < CHARACTER_COST || (mode === 'image' && !referenceImage)}
          className="generate-button"
        >
          {isGenerating ? (
            'Generating...'
          ) : (
            <>
            {isReferenceSheet ? "Generate Reference Sheet" : "Generate Character"} 
            <span className="credit-cost">
              {isReferenceSheet ? REFERENCE_SHEET_COST : CHARACTER_COST}
            </span>
            <img src="/credit-icon.png" alt="Credits" className="credit-icon" />
          </>
          )}
        </button>
        {error && <div className="error-message">{error}</div>}
        {generatedImage && (
  <div className="result-panel">
    {isReferenceSheet ? (
      <div className="sheet-grid">
        {generatedImage.split("|").map((url, idx) => (
          <div key={idx} className="image-container">
            <img src={url} alt={`View ${idx}`} />
          </div>
        ))}
      </div>
    ) : (
      <div className="image-container">
        <img src={generatedImage} alt="Generated character" />
      </div>
    )}
     <div style={{ textAlign: 'center', marginTop: '12px' }}>
      <button onClick={downloadImage} className="download-button">
        Download Image
      </button>
    </div>
  </div>

)}
 <MobileNav /> {/* Only visible on mobile */}
      </div>
    </div>
  );
}