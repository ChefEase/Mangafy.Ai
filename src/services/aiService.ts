// Add at the top of aiService.ts
import { HfInference, } from "@huggingface/inference";


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

// Gradio API Configuration
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
      prompt: "black and white manga, screentone shading, hand-drawn ink lines, minimal color, Japanese comic layout, dramatic paneling",
      negative_prompt: "color, 3D, CGI, photorealistic, painterly, soft gradients, western comic style"
    },
  
    "one-piece": {
      prompt: "one piece art style, exaggerated expressions, cartoony anatomy, bold black outlines, bright cel-shading, dynamic action poses, whimsical designs, chaotic energy",
      negative_prompt: "photorealistic, 3D, CGI, hyperrealistic, blurred, low detail, child-like drawing, watermark, signature, duplicate heads, text errors, out-of-focus, poorly drawn anatomy, plain background, pastel art style"
    },
  
    "jujutsu-kaisen": {
      prompt: "jujutsu kaisen art style, dark tone, heavy shadows, cursed energy effects, sharp linework, serious expressions, anime action, gritty atmosphere",
      negative_prompt: "bright colors, overly simplified designs, clean digital look, soft pastels, cute expressions"
    },
  
    "my-hero-academia": {
      prompt: "my hero academia art style, sharp cel-shading, comic-style motion lines, heroic poses, colorful uniforms, expressive faces, bold outlines, dynamic panels",
      negative_prompt: "realistic, washed-out tones, low detail, grayscale, horror style"
    },
  
    "dandadan": {
      prompt: "dandadan art style, surreal atmosphere, eerie lighting, detailed linework, supernatural elements, chaotic composition, dramatic expressions, anime horror-fantasy fusion",
      negative_prompt: "orderly, too clean, flat linework, pastel tones, generic backgrounds"
    },
  
    "quintessential-quintuplets": {
      prompt: "quintessential quintuplets art style, romantic atmosphere, soft lighting, pastel palette, gentle expressions, clean thin line art, bright warm backgrounds, anime romance vibe",
      negative_prompt: "dark themes, excessive contrast, rough inking, horror elements, strong shadows"
    },
  
    "tokyo-revengers": {
      prompt: "tokyo revengers art style, urban street vibe, thin line art, confident stances, semi-muted colors, gang fashion, action blur, cityscape backgrounds, gritty youth drama",
      negative_prompt: "clean, overly polished, soft shading, 3D rendering, overly detailed fantasy backgrounds"
    },
  
    "comic-book": {
      prompt: "comic book style, Marvel, DC Comics, heroic proportions, bold black outlines, halftone texture, dramatic lighting, vibrant colors, inked shading, dynamic pose, American superhero comics",
      negative_prompt: "anime, watercolor, grayscale, painterly, photorealistic, manga, screentones"
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
  You are a prompt optimization assistant for AI image generation.
  - You receive a raw prompt that may be too long or redundant.
  - Your job is to reduce it under 77 tokens.
  - Keep only visually important keywords: actions, camera angle, art style, colors, clothing, body language, lighting.
  - Remove fluff, repetition, and minor details.
  - Focus on the *main action* and distinctive traits.
  Return only the optimized prompt.
  `;
  
    const result = await this.hf.chatCompletion({
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1", // or another chat-compatible model
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Prompt:\n${prompt}` }
      ],
      parameters: {
        max_new_tokens: 80,
        temperature: 0.7,
        top_p: 0.95
      }
    });
  
    if (!result || !result.choices?.[0]?.message?.content) {
      throw new Error("Prompt compression failed or response malformed");
    }
  
    return result.choices[0].message.content.trim();
  }
  
  
  async generateTextToImage(opts: {
    prompt: string;
    negative_prompt?: string;
    steps?: number;
    width?: number;
    height?: number;
    guidance_scale?: number;
    sampler?: string;
    aspect_ratio?: string;
    style?: string;
    quality?: string;
    use_upscaler?: boolean;
    upscaler_strength?: number;
    upscale_by?: number;
    add_quality_tags?: boolean;
    seed?:number;
    num_inference_steps?: number; 
  }): Promise<Blob> {
    const response = await fetch("https://b213fa2311ce.ngrok-free.app/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: opts.prompt,
        negative_prompt: opts.negative_prompt ?? "",
        width: opts.width ?? 1024,
        height: opts.height ?? 1024,
        guidance_scale: opts.guidance_scale ?? 13.5,
        seed: opts.seed ?? Math.floor(Math.random() * 10000000),
        sampler: opts.sampler ?? "Euler a",
        aspect_ratio: opts.aspect_ratio, // fallback default if not mappe
        num_inference_steps: 30,
        style: opts.style,
        quality: opts.quality ?? "Standard v3.1",
        use_upscaler: opts.use_upscaler ?? true,
        upscaler_strength: opts.upscaler_strength ?? 0.55,
        upscale_by: opts.upscale_by ?? 1.5,
        add_quality_tags: opts.add_quality_tags ?? true,
      }),
    });
    let json;
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to generate image: ${response.status}`);
    }
    const blob = await response.blob(); // Directly get Blob from response
    if (blob.type !== 'image/png') {
      throw new Error(`Unexpected content type: ${blob.type}`);
    }
    console.log('Response Content-Type:', response.headers.get('content-type'));
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
private mapToClosestAspectRatio(width: number, height: number): string {
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
  return this.withRetry(async () => {
    const styleConfig = this.ART_STYLES[payload.style] ?? this.ART_STYLES.default; 
    const colorKey = payload.color ?? "black_white"; 
    const colorConfig = this.COLOR_OPTIONS[colorKey];

    // Dimension validation logic preserved
    const colorPrompt = colorConfig.prompt;
    if (!colorConfig) {
      throw new Error(`Invalid color option: ${payload.color}`);
    }
    
    // Prompt generation logic preserved
    const cleanedScene = payload.scene.replace(/\(Camera:.*?\)/gi, '').trim();
    const negativePrompt = `${styleConfig.negative_prompt}, ${colorConfig.negative_prompt}`;

    const cleanPrompt = ` Camera: ${payload.cameraAngle} ${this.generateSceneSpecificPrompt(payload.scene, styleConfig)},
     ${colorPrompt}, Scene: ${cleanedScene}`.trim().replace(/\s+/g, ' ');
    const randomSeed = Math.floor(Math.random() * 10000000); // ✅ Random seed between 0 and 99999
    const shortenedPrompt = await this.compressPrompt(cleanPrompt);
      // Replace HF calls with Gradio integration
      const blob = await aiService.generateTextToImage({
        prompt: shortenedPrompt,
        negative_prompt: negativePrompt,
        width: payload.width!,
        height: payload.height!,
        guidance_scale: 13.5,
        seed: randomSeed,
        sampler: "Euler a",
        aspect_ratio: this.mapToClosestAspectRatio(payload.width!, payload.height!),
        num_inference_steps: 35,
        style: payload.gradioStyle,
        quality: "Standard v3.1",
        use_upscaler: true,
        upscaler_strength: 0.55,
        upscale_by: 1.5,
        add_quality_tags: true,
      });
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
  });
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