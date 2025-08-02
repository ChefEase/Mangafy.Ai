'use client';
import React, { useState, useRef } from 'react';
import { aiService } from '../../services/aiService';
import Image from 'next/image';
import './styles/CharacterGenerator.css';
import { useCredits } from '@/context/CreditContext'; // Add this import

export default function CharacterGenerator() {
  const { credits, deductCredits, addCredits } = useCredits(); // Get credit functions
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [params, setParams] = useState({
    prompt: '',
    negative_prompt: 'nsfw, text, deformed, mutated, worst quality',
    textStyle: 'anime',
    imageStyle: 'Ghibli',
    guidance_scale: 13.5,
    num_inference_steps: 35,
    seed: 42,
    width: 1024,
    height: 1820,
  });
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null); // Add error state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const CHARACTER_COST = 10; // Define character generation cost

  const generateCharacter = async () => {
    setIsGenerating(true);
    setError(null);
    // Check credits before proceeding
    let creditsDeducted = false; // 👈 Track if we deducted
    if (credits < CHARACTER_COST) {
      setError(`You need ${CHARACTER_COST} credits to generate a character`);
      setIsGenerating(false);
      return;
    }
    try {
      let result: Blob | String;
      if (mode === 'text') {
        const fullPrompt = `${params.prompt}, ${getStylePrompt(params.textStyle)}, high quality character design`;
        result = await aiService.generateTextToImageReplicate({
          prompt: fullPrompt,
          negative_prompt: params.negative_prompt,
          width: params.width,
          height: params.height,
          cfg_scale: 13.5,
          steps: 35,
          seed: Math.floor(Math.random() * 2_000_000) + 1,
        }) as Blob | String;
        
        console.log("result:", result);
        console.log("typeof result:", typeof result);
      
        let imageUrl: string;

        // Fix: TypeScript error with 'instanceof' on 'Blob'
        // Use a safer check for Blob: check for 'object', 'type' property, and 'slice' method
        if (
          typeof result === 'object' &&
          result !== null &&
          typeof (result as Blob).type === 'string' &&
          typeof (result as Blob).slice === 'function'
        ) {
          // ✅ Case 1: Blob object
          imageUrl = URL.createObjectURL(result as Blob);
          console.log("Image generated as Blob, created object URL:", imageUrl);
        } else if (typeof result === 'string') {
          // ✅ Case 2: string — base64 or URL
          if (result.startsWith('data:image/')) {
            imageUrl = result; // Already a data URL
          } else if (result.startsWith('http://') || result.startsWith('https://')) {
            imageUrl = result; // Image URL
          } else {
            imageUrl = `data:image/png;base64,${result}`; // Raw base64 string
          }
        } else {
          throw new Error('Unsupported image format returned from AI service.');
        }

        const deductionSuccess = await deductCredits(CHARACTER_COST);
        if (!deductionSuccess) {
          throw new Error("Credit deduction failed");
        }
        creditsDeducted = true; // ✅ TRACK IT HERE
        setGeneratedImage(imageUrl);
        setIsGenerating(false);
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
  const data = await res.json();
  console.log("👉 Full response data:", data);
  console.log("Reference image before sending:", referenceImage);

  if (!res.ok || !data?.image?.url) {
    if (data.error?.includes("exceeded your GPU quota")) {
      alert("⏳ You've hit the GPU limit on the backend model. Please try again in a few hours.");
    } else {
      alert(data.error || "Image generation failed.");
    }
    throw new Error("No image URL returned from server");
  }

  const deductionSuccess = await deductCredits(CHARACTER_COST);
  if (!deductionSuccess) {
    throw new Error("Credit deduction failed");
  }
  creditsDeducted = true; // ✅ TRACK IT HERE
  setGeneratedImage(data.image.url);

console.log(data); // 👀 check structure
  console.log("data.image:", data.image);
  console.log("typeof data.image:", typeof data.image);
  
      }
  
    } catch (err: any) {
      if (creditsDeducted) {
        await addCredits(CHARACTER_COST);
      }
       setError(
         err.message || 
         "Generation failed. Credits have been refunded. Please try again."
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

  const getStylePrompt = (style: string) => {
    const styles = {
      vinlandSaga: 'Vinland Saga style, gritty realism, detailed armor and clothing, Norse aesthetic, expressive faces, muted tones',
      promisedNeverland: 'Promised Neverland style, soft lines, large expressive eyes, eerie lighting, delicate features, suspenseful atmosphere',
      dandadan: 'Dandadan style, high-energy action, sharp features, intricate supernatural designs, intense motion lines, vivid color pops',
      quintessentialQuintuplets: 'Quintessential Quintuplets style, romantic comedy aesthetic, bright colors, glossy eyes, soft shading, detailed school uniforms',
      jujutsuKaisen: 'Jujutsu Kaisen style, edgy linework, modern urban feel, dynamic action poses, cursed energy effects, gritty yet stylish',
      tokyoRevengers: 'Tokyo Revengers style, sharp and clean line art, gang fashion, expressive emotion, time-travel edge, street-style tone',
      onePiece: 'One Piece style, exaggerated expressions, cartoonish proportions, vibrant color palette, adventurous and whimsical elements',
      myHeroAcademia: 'My Hero Academia style, comic-inspired layout, dynamic action poses, flashy powers, clean shading, modern superhero vibe',
      bleach: 'Bleach style, sleek character designs, flowing clothing, spiritual energy effects, dramatic contrasts, monochrome and color blends',
      chainsawMan: 'Chainsaw Man style, gritty and raw, chaotic energy, horror-influenced design, sketchy linework, intense emotion',
      comicBook: 'American comic book style (Marvel/DC), bold outlines, muscular anatomy, dramatic poses, vibrant color blocking, classic superhero aesthetic',
      waifu: 'Waifu style, ultra-polished anime look, perfect skin, big sparkly eyes, glossy hair, soft lighting, idealized beauty, more appeal',
      swordArtOnline: 'Sword Art Online style, sleek character designs, glowing digital effects, fantasy-meets-sci-fi armor, ethereal lighting',
      naruto: 'Naruto style, sharp angular features, chakra effects, ninja gear, hand signs, dynamic motion lines, emotional intensity',
      dragonBall: 'Dragon Ball style, bold muscles, energy auras, spiky hair, explosive action scenes, classic shounen aesthetic',
      reZero: 'Re:Zero style, detailed fantasy clothing, emotional expressions, soft pastel colors, dramatic lighting, isekai charm'
    };        
    return styles[style as keyof typeof styles] || '';
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
              Generate Character <span className="credit-cost">{CHARACTER_COST}</span>
              <img src="/credit-icon.png" alt="Credits" className="credit-icon" />
            </>
          )}
        </button>
        {error && <div className="error-message">{error}</div>}
        {generatedImage && (
          <div className="result-panel">
            <div className="image-container">
              <img src={generatedImage} alt="Generated character" />
              <div className="download-options">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = generatedImage;
                    link.download = `character_${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  Download PNG
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}