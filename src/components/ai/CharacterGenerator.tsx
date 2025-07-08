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
    negative_prompt: 'nsfw, text, deformed, mutated',
    textStyle: 'anime',
    imageStyle: 'Ghibli',
    guidance_scale: 3.5,
    num_inference_steps: 25,
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
    if (credits < CHARACTER_COST) {
      setError(`You need ${CHARACTER_COST} credits to generate a character`);
      setIsGenerating(false);
      return;
    }
    try {
      const deductionSuccess = await deductCredits(CHARACTER_COST);
      if (!deductionSuccess) {
        throw new Error("Credit deduction failed");
      }
      let result;
  
      if (mode === 'text') {
        const fullPrompt = `${params.prompt}, ${getStylePrompt(params.textStyle)}, high quality character design`;
        result = await aiService.generateTextToImageFluxDev({
          prompt: fullPrompt,
          negative_prompt: params.negative_prompt,
          steps: 40,
        });
      
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
      
        setGeneratedImage(imageUrl);
        setIsGenerating(false);
      } else {
        // ✅ IMAGE-TO-IMAGE — UPDATED TO USE /api/generate-image
        if (!referenceImage) throw new Error("Please upload a reference image");
  
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Image = reader.result as string;
          const blob = await (await fetch(base64Image)).blob();

          const formData = new FormData();
          formData.append("prompt", params.prompt);
          formData.append("lora_name", params.imageStyle.replace(/\s+/g, "_"));
          formData.append("guidance_scale", params.guidance_scale.toString());
          formData.append("num_inference_steps", params.num_inference_steps.toString());
          formData.append("seed", params.seed.toString());
          formData.append("width", params.width.toString());
          formData.append("height", params.height.toString());
          formData.append("image", referenceImage);
          
  formData.append("prompt", params.prompt);
  
  const res = await fetch("/api/generate-image", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  console.log("👉 Full response data:", data);

  if (!res.ok) {
    throw new Error(data.error || "Unknown error");
  }

  if (data?.image?.url) {
    setGeneratedImage(data.image.url);
  } else {
    if (data.error?.includes("exceeded your GPU quota")) {
      alert("⏳ You've hit the GPU limit on the backend model. Please try again in a few hours.");
    } else {
      alert(data.error || "Image generation failed.");
    }
    throw new Error("No image URL returned from server");
  }  
  
console.log(data); // 👀 check structure
  console.log("data.image:", data.image);
  console.log("typeof data.image:", typeof data.image);
  
          setIsGenerating(false);
        };
  
        reader.readAsDataURL(referenceImage); // triggers reader.onloadend
      }
  
    } catch (err: any) {
       // Refund credits on error
       await addCredits(CHARACTER_COST);
      
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
      anime: 'anime style, vibrant colors, cel-shading, studio ghibli',
      manga: 'black and white manga style, screentones, ink drawing',
      western: 'western comic style, bold lines, dynamic shading',
      realistic: 'photorealistic, detailed anatomy, realistic proportions',
      fantasy: 'fantasy art, digital painting, magical atmosphere'
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
      <option value="anime">Anime</option>
      <option value="manga">Manga</option>
      <option value="western">Western Comic</option>
      <option value="realistic">Realistic</option>
      <option value="fantasy">Fantasy Art</option>
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
              <label>Art Style</label>
              <select
                value={params.imageStyle}
                onChange={(e) => {
                  console.log('Image Style changed:', e.target.value);
                  setParams({ ...params, imageStyle: e.target.value });
                }}
              >
                <option>American Cartoon</option>
                <option>Chines Ink</option>
                <option>Ghibli</option>
                <option>Jojo</option>
                <option>Line</option>
                <option>Vector</option>
              </select>
            </div>

              <div className="form-group">
                <label>Guidance Scale</label>
                <input
                  type="range"
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={params.guidance_scale}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    console.log('Guidance Scale changed:', value);
                    setParams({ ...params, guidance_scale: value });
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
                    const value = parseInt(e.target.value);
                    console.log('Inference Steps changed:', value);
                    setParams({ ...params, num_inference_steps: value });
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

              <div className="form-group">
                <label>Width</label>
                <input
                  type="number"
                  min="64"
                  step="8"
                  value={params.width}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    console.log('Width changed:', value);
                    setParams({ ...params, width: value });
                  }}
                />
              </div>

              <div className="form-group">
                <label>Height</label>
                <input
                  type="number"
                  min="64"
                  step="8"
                  value={params.height}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    console.log('Height changed:', value);
                    setParams({ ...params, height: value });
                  }}
                />
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