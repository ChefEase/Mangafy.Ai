// Add at the top of aiService.ts
import { HfInference, } from "@huggingface/inference";
import {enforceNoDialogueAndStyle} from '@/utils/promptUtils'

interface Panel {
  id: string;
  generatedImage: string;
  scriptSegment: string;
  layoutPosition: number;
}

interface HuggingFaceStatusResponse {
  data: {
    loaded: boolean;
    state?: string;
    error?: string;
    compute_type?: string;
    transformers_version?: string;
  };
}
interface HuggingFaceModelStatus {
  loaded: boolean;
  state?: 'Loaded' | 'Loading' | 'Failed';
  compute_type?: string;
  transformers_version?: string;
  error?: string;
}

interface ArtStyleConfig {
  prompt: string;
  negative_prompt: string;
  model?: string;
}

export type ArtStyle = keyof AIService['ART_STYLES'];
type ColorOption = "colored" | "black_white";
type GradioStyle = "(None)" | "Cinematic" | "Photographic" | "Anime" | "Manga" | "Digital Art" | "Pixel art" | "Fantasy art" | "Neonpunk" | "3D Model";

const GRADIO_TO_REPLICATE_STYLE: Record<GradioStyle, string> = {
  "(None)": "(None)",
  "Manga": "Manga",
  "Anime": "Anime",
  "Cinematic": "Cinematic",
  "Photographic": "Photographic",
  "Digital Art": "Digital Art",
  "Pixel art" : "Pixel art",
  "Fantasy art": "Fantasy art",
  "Neonpunk":  "Neonpunk",
  "3D Model": "3D Model"
};

function sanitizeScenePrompt(raw: string): string {
  // Remove quoted dialogue like "..." or ‘...’
  let cleaned = raw.replace(/["“”‘’][^"“”‘’]*["“”‘’]/g, "");

  // Collapse repeated descriptors (simple heuristic: split by commas, dedupe while preserving order)
  const parts = cleaned
    .split(",")
    .map(p => p.trim())
    .filter(p => p.length > 0);
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      deduped.push(part);
    }
  }

  return deduped.join(", ");
}
// Added log to show the mapping for debugging
console.log("GRADIO_TO_REPLICATE_STYLE mapping:", GRADIO_TO_REPLICATE_STYLE);
export class AIService {
  private hf: HfInference;
  private readonly TEXT_MODEL = "black-forest-labs/FLUX.1-dev";
  private readonly TEXTER_MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1";
  private readonly COMPRESS_MODEL = "mistralai/Mistral-Nemo-Instruct-2407";
  private readonly IMAGE_TO_TEXT_MODEL = "Salesforce/blip-image-captioning-base";
  private HF_TOKEN = process.env.NEXT_PUBLIC_HF_TOKEN!; // put your HF token in .env.local

  private readonly COLOR_OPTIONS = {
    black_white: {
      prompt: "black and white manga with traditional screentones, greyscale, no color",
      negative_prompt: "color"
    },
    colored: {
      prompt: "",
      negative_prompt: ""
    }
  } as const;
  // Art style configurations without model references
  private readonly ART_STYLES = {
    default: {
      prompt: "black and white manga, screentone shading, hand-drawn ink lines,",
      negative_prompt: "color, 3D, CGI, photorealistic, painterly, soft gradients, western comic style, deformed hands, deformed body parts"
    },
  
    "one-piece": {
      prompt: "one piece art style",
      negative_prompt: "photorealistic, 3D, CGI, hyperrealistic, blurred, low detail, child-like drawing, watermark, signature, duplicate heads, text errors, out-of-focus, poorly drawn anatomy, plain background, pastel art style"
    },
  
    "jujutsu-kaisen": {
      prompt: "jujutsu kaisen art style",
      negative_prompt: "bright colors, overly simplified designs, clean digital look, soft pastels, cute expressions, deformed hands, deformed body parts"
    },
  
    "my-hero-academia": {
      prompt: "my hero academia art style",
      negative_prompt: "realistic, washed-out tones, low detail, grayscale, horror style, deformed hands, deformed body parts"
    },
  
    "dandadan": {
      prompt: "dandadan art style, surreal atmosphere, eerie lighting, detailed linework,",
      negative_prompt: "orderly, too clean, flat linework, pastel tones, generic backgrounds, deformed hands, deformed body parts"
    },
  
    "quintessential-quintuplets": {
      prompt: "quintessential quintuplets art style, romantic atmosphere, clean thin line art",
      negative_prompt: "dark themes, excessive contrast, rough inking, horror elements, strong shadows, deformed hands, deformed body parts"
    },
  
    "tokyo-revengers": {
      prompt: "tokyo revengers art style, thin line art",
      negative_prompt: "clean, overly polished, soft shading, 3D rendering, overly detailed fantasy backgrounds, deformed hands, deformed body parts"
    },
  
    "comic-book": {
      prompt: "Dc comic book art style, bold black outlines, halftone texture, inked shading",
      negative_prompt: "anime, watercolor, grayscale, painterly, photorealistic, manga, screentones, deformed hands, deformed body parts"
    }
  } as const;
  

  constructor() {
    // Keep your existing constructor logic
    if (!process.env.NEXT_PUBLIC_HF_TOKEN) {
      throw new Error('Hugging Face token missing in environment variables');
    }
    this.hf = new HfInference(process.env.NEXT_PUBLIC_HF_TOKEN);
    console.log("HF API Key:", process.env.NEXT_PUBLIC_HF_TOKEN);
  }

  private async checkModelStatus(model: string) {
    try {
      interface ModelStatusResponse {
        loaded: boolean;
        state?: string;
        error?: string;
      }
  
      const response = await this.hf.request({
        method: "GET",
        url: `https://api-inference.huggingface.co/status/${model}`
      }as any);
  
      // Explicitly type the response
      const responseData = response as ModelStatusResponse;
  
      if (!responseData.loaded) {
        throw new Error(`Model ${model} is ${responseData.state || 'not loaded'}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Model status check failed: ${error.message}`);
      }
      throw new Error("Unknown error occurred during model status check");
    }
  }  

  async compressPrompt(prompt: string): Promise<string> {
    const systemInstruction = `
    You are a prompt compression tool for AI image generation.
    Convert a natural-language scene description into a concise, comma-separated list of visual tags under 77 tokens.
    
    Requirements:
    1. Only include the character(s) explicitly mentioned in the input. If only 1boy is mentioned, do not add any 1girl or others If 1girl is mentioned don't add 1boy.
    1. For each character, start with "1boy" or "1girl", followed by distinctive traits (hairstyle, eye color, clothing), their action, and camera angle. Do not merge character traits.
    2. Include the specified art style as the first style tag (e.g., "one piece art style", "manga").
    3. Include environment/setting tags (city, medium shot, lighting, etc.).
    4. REMOVE any dialogue or quoted speech completely. Do not output any spoken text, quotes, or implied conversation.
    5. Eliminate duplicate descriptors; each visual concept should appear only once.
    6. Output only comma-separated tags. No explanations, no full sentences, no extra text.
    
    Example for Only One Person If it's 1boy Explicitly mentioned:
    1boy, wolf cut hairstyle, blue eyes, black suit, walking, busy city street, medium shot, one piece art style, greyscale

    Example for Only One Person If it's 1boy Explicitly mentioned:
    1girl, wolf cut hairstyle, blue eyes, black suit, walking, busy city street, medium shot, one piece art style, greyscale

    Example for More than One Person Explicitly mentioned:
    1boy, wolf cut hairstyle, blue eyes, black suit, walking, busy city street, medium shot, one piece art style, greyscale
    1girl, long brown hair in bun, white baggy shirt, blue jeans, walking, busy city street, medium shot, one piece art style, greyscale

    This are Just examples u don't need to include it verbatim in the prompt. Just use the description of the character and what the user wants.
    `;
    
    const result = await this.hf.chatCompletion({
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Prompt:\n${prompt}` }
      ],
      parameters: {
        max_new_tokens: 80,
        temperature: 0.6,
        top_p: 0.9
      }
    });
  
    if (!result || !result.choices?.[0]?.message?.content) {
      throw new Error("Prompt compression failed or response malformed");
    }
  
    return result.choices[0].message.content.trim();
  }
  
    // ✅ FRONTEND — safe to call your own backend API
    async generateTextToImageReplicate(opts: {
      prompt: string;
      negative_prompt?: string;
      width?: number;
      height?: number;
      seed?: number;
      steps?: number;
      cfg_scale?: number;
      style_selector?: string; // e.g., "Manga" or "Anime"
    }): Promise<Blob> {
      const res = await fetch("/api/replicate-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: opts.prompt,
          negative_prompt: opts.negative_prompt ?? "nsfw, naked",
          width: opts.width ?? 1024,
          height: opts.height ?? 1024,
          steps: opts.steps ?? 35,
          cfg_scale: opts.cfg_scale ?? 7,
          seed: opts.seed ?? 28,
          style_selector: opts.style_selector ?? "Anime", // default fallback
        }),
      });
    
      const data = await res.json();
    
      if (!res.ok || !data?.image?.url) {
        console.error("Backend error response:", data);
        throw new Error(data.error || "Image generation failed");
      }
    
      const imageUrl = data.image.url;
    
      // 🖼️ Fetch the actual image
      const imageResponse = await fetch(imageUrl);
if (!imageResponse.ok) {
  const bodyText = await imageResponse.text();
  console.error("Image fetch failed:", bodyText);
  throw new Error("Failed to fetch image blob");
}
const contentType = imageResponse.headers.get("content-type") || "";
if (!contentType.startsWith("image/")) {
  const bodyText = await imageResponse.text();
  console.error("Expected image, got:", contentType, bodyText.slice(0, 500));
  throw new Error("Blob is not an image");
}
const blob = await imageResponse.blob();

      // Final check
      if (!(blob instanceof Blob) || !blob.type.startsWith("image/")) {
        console.error("Returned blob is invalid:", blob);
        throw new Error("Blob is not an image");
      }
    
      return blob;
    }
    
  async generateTextToImageFluxDev(payload: {
    prompt: string;
    negative_prompt?: string;
    steps?: number;
    width?: number;
    height?: number;
    guidance_scale?: number;
  }) {
    try {
      return await this.hf.textToImage({
        model: this.TEXT_MODEL,
        inputs: payload.prompt,
        parameters: {
          negative_prompt: payload.negative_prompt || "deformed, ugly, blurry, low quality",
          num_inference_steps: payload.steps || 5, // Default to 5 steps as in your example
          width: payload.width || 1024,
          height: payload.height || 1024,
          guidance_scale: payload.guidance_scale || 13.5,
        },
       // Force Replicate provider
      });
    } catch (error) {
      this.handleError(error, "text-to-image");
      throw error;
    }
  }

  async generateImageDescription(image: Blob): Promise<string> {
    try {
      const response = await this.hf.imageToText({
        data: image,
        model: this.IMAGE_TO_TEXT_MODEL,
      });
  
      if (!response?.generated_text) {
        throw new Error("No description generated from image");
      }
  
      // Enhance the description with explicit details
      return response.generated_text
    .replace(/a (cartoon|anime|manga) of/gi, '')
    .replace(/[\-•]/g, '')
    .replace(/\([^)]*\)/g, '') // Remove parentheses
    .replace(/\b(character|person|woman|man)\b/gi, '')
    .substring(0, 300); // Limit length
  
    } catch (error) {
      this.handleError(error, "image-to-text");
      throw error;
    }
  }
  
 // Enhanced error handler
 private handleError(error: unknown, serviceType: string) {
  let errorMessage = 'Unknown error';
  
  if (error instanceof Error) {
    errorMessage = error.message;
    if (error.message.includes("No Model Provided")) {
      errorMessage = "Model Validation Failed";
    } else {
      errorMessage = error.message;
    }
  }

  console.error(`AI Service Error (${serviceType}):`, error);
  throw new Error(errorMessage);
}

private generateSceneSpecificPrompt(scene: string, styleConfig: ArtStyleConfig): string {
  return `${styleConfig.prompt}, ${scene}`
}
public mapToClosestAspectRatio(width: number, height: number): string {
  const ratioMap = [
    { width: 1024, height: 1024, label: "1024 x 1024" },
    { width: 1152, height: 896, label: "1152 x 896" },
    { width: 896, height: 1152, label: "896 x 1152" },
    { width: 1216, height: 832, label: "1216 x 832" },
    { width: 832, height: 1216, label: "832 x 1216" },
    { width: 1344, height: 768, label: "1344 x 768" },
    { width: 768, height: 1344, label: "768 x 1344" },
    { width: 1536, height: 640, label: "1536 x 640" },
    { width: 640, height: 1536, label: "640 x 1536" },
  ];

  const closest = ratioMap.reduce((prev, curr) => {
    const prevDiff = Math.abs(prev.width / prev.height - width / height);
    const currDiff = Math.abs(curr.width / curr.height - width / height);
    return currDiff < prevDiff ? curr : prev;
  });

  return closest.label;
}

async generatePanel(payload: {
  scene: string;
  characters: any[];
  style: ArtStyle;
  cameraAngle: string;
  width?: number;
  height?: number;
  color: ColorOption;
  gradioStyle: GradioStyle;
}) {
  {
    const styleConfig = this.ART_STYLES[payload.style] ?? this.ART_STYLES.default; 
    const colorKey = payload.color ?? "black_white"; 
    const colorConfig = this.COLOR_OPTIONS[colorKey];

    // Dimension validation logic preserved
    const colorPrompt = colorConfig.prompt;
    if (!colorConfig) {
      throw new Error(`Invalid color option: ${payload.color}`);
    }
    
    // Prompt generation logic preserved
    const rawScene = payload.scene;
const sanitizedScene = sanitizeScenePrompt(rawScene);

    const cleanedScene = sanitizedScene.replace(/\(Camera:.*?\)/gi, '').trim();
    const negativePrompt = `${styleConfig.negative_prompt}, ${colorConfig.negative_prompt}`;
    const styleSelector = GRADIO_TO_REPLICATE_STYLE[payload.gradioStyle] ?? "Anime";
    const stylePromptTag = styleConfig.prompt; // e.g., "one piece art style"
    const cleanPrompt = `Camera: ${payload.cameraAngle} ${this.generateSceneSpecificPrompt(sanitizedScene, styleConfig)},
     ${colorPrompt}, Scene: ${cleanedScene}`.trim().replace(/\s+/g, ' ');
     const fullPromptForCompression = `${stylePromptTag}, ${cleanPrompt}`;
    const randomSeed = Math.floor(Math.random() * 10000000); // ✅ Random seed between 0 and 99999
    let shortenedPrompt = await this.compressPrompt(fullPromptForCompression);
    shortenedPrompt = enforceNoDialogueAndStyle(shortenedPrompt, styleConfig.prompt);
      // Replace HF calls with Gradio integration
      const blob = await aiService.generateTextToImageReplicate({
        prompt: shortenedPrompt,
        negative_prompt: negativePrompt,
        width: payload.width!,
        height: payload.height!,
        cfg_scale: 7,
        steps: 28,
        seed: randomSeed,
        style_selector: styleSelector
      });

      if (!(blob instanceof Blob)) {
        throw new Error("Panel image is not a blob!");
      }
      
      // Extra check: Confirm it's a valid image MIME
      if (!blob.type.startsWith("image/")) {
        const text = await blob.text(); // For debugging invalid payload
        console.error("Returned blob is not an image:", text);
        throw new Error("Invalid image format returned from Replicate");
      }

      const url = URL.createObjectURL(blob);
      // Call Gradio API
      if (shortenedPrompt.split(/\s+/).length > 77) {
        console.warn("Prompt still too long after compression!");
      }
      
      const isValid = await this.validateImage(blob);
      if (!isValid) throw new Error("Invalid image generated");

      if (payload.color === "black_white") {
        const bwBlob = await this.applyGrayscale(blob);
        return bwBlob; // ✅ Make sure this is returned instead
      } 

      return blob;
  };
}

private async applyGrayscale(blob: Blob): Promise<Blob> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('applyGrayscale only runs in the browser'));
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const contrast = 1.1; // try 1.0 to 1.3 for soft manga tones
      const brightness = -10; // try -20 to +20 if needed

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        let lum = 0.299 * r + 0.587 * g + 0.114 * b;

        lum = (lum - 128) * contrast + 128 + brightness;
        lum = Math.max(0, Math.min(255, lum));

        data[i] = data[i + 1] = data[i + 2] = lum;
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((grayscaleBlob) => resolve(grayscaleBlob!), 'image/png');
    };
    img.src = URL.createObjectURL(blob);
  });
}

private async validateImage(blob: Blob): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(blob);
  });
}

private async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 3000 * (4 - retries)));
      return this.withRetry(fn, retries - 1);
    }
    throw error;
  }
}

private validateModel(model: string) {
  if (!model.includes('/')) {
    throw new Error(`Invalid model format: ${model}. Use "author/model-name" format`);
  }
}

  async generatePanelWithReference(payload: {
    scene: string;
    characters: Array<{ image: Blob, description: string }>;
  }) {
    const prompt = `Scene: ${payload.scene}\nCharacters: ${payload.characters.map(c => c.description).join(', ')}`;
    
    return this.hf.imageToImage({
      model: "black-forest-labs/FLUX.1-dev",
      inputs: payload.characters[0].image, // Use first character image as base
      parameters: {
        prompt,
        strength: 0.65
      }
    });
  }

  async applyCharacterStyle(baseImage: Blob, characterRef: Blob) {
    return this.hf.imageToImage({
      model: "black-forest-labs/FLUX.1-dev",
      inputs: baseImage,
      parameters: {
        prompt: "Maintain character style from reference",
        reference_image: characterRef,
        strength: 0.65
      }
    });
  }

  // aiService.ts - Add to AIService class
  async generateStoryboard(panels: Panel[], scriptContent: string) {
    try {
      return await this.hf.textToImage({
        model: "black-forest-labs/FLUX.1-dev",
        inputs: `Storyboard for: ${scriptContent}\nPanels: ${panels.map(p => p.scriptSegment).join('\n')}`,
        parameters: {
          width: 1792,
          height: 1024,
          guidance_scale: 13.5,
          num_inference_steps: 50
        }
      });
    } catch (error) {
      this.handleError(error, "storyboard-generation");
      throw error;
    }
  }
    // 🚀 **3. Ensure Character Consistency**
  async ensureCharacterConsistency(image: Blob, prompt: string) {
    try {
      return await this.hf.imageToImage({
        model: "stabilityai/stable-diffusion-xl-refiner-1.0",
        inputs: image,
        parameters: {
          prompt: `Same character as reference, consistent design: ${prompt}`,
          strength: 0.4,
        },
      });
    } catch (error) {
      this.handleError(error, "character-consistency");
      throw error;
    }
  }

  async generateScenesFromOutline(outline: string, panelCount: number, retries=3 ) {
    if (typeof outline !== 'string') {
      console.error("Invalid outline type:", typeof outline);
      throw new Error("Outline must be a string");
    }
    console.log("Sending outline to backend:", outline);
    try {
      const response = await fetch("https://mangafy-ai-backend.onrender.com/app/script-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outline, panelCount }),
      });
  
      if (!response.ok) {
        const errorBody = await response.json();
        console.error("API Error Response:", errorBody);
        throw new Error(`HTTP error! Status: ${response.status} - ${errorBody.error}`);
      }
  
      const data = await response.json();
      console.log("Raw Panel Data:", data);

      if (!data?.panels?.length) {
        console.error("Invalid panel structure, raw data:", data);
        throw new Error("No panels array found in response");
      }

      const isValid = data.panels.every((panel: any) => 
        panel.scene?.trim() && 
        panel.camera?.trim() && 
        panel.dialogue?.trim()
      );
  
      if (!isValid) {
        console.error("Invalid Panel Structure:", data.panels);
        throw new Error("Panels missing required fields (scene, camera, dialogue)");
      }

    
      return data.panels.map((panel: any) => 
        `${panel.scene} (Camera: ${panel.camera}) - Dialogue: "${panel.dialogue}"`
      );

    } catch (error) {
      this.handleError(error, "scene-generation");
      throw error;
    }
  }
  
      // Add additional AI services as needed
  async upscaleImage(image: Blob) {
    try {
      return await this.hf.imageToImage({
        model: "lambdalabs/sd-image-variations-diffusers",
        inputs: image,
        parameters: {
          prompt: "High quality upscale, detailed, 4k resolution",
          strength: 0.3
        }
      });
    } catch (error) {
      this.handleError(error, "image-upscale");
      throw error;
    }
  }
}

export const aiService = new AIService();