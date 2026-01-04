// Add at the top of aiService.ts
import { HfInference, InferenceClient } from "@huggingface/inference";
import {enforceNoDialogueAndStyle, calculateBudget, countWordsAndCommas} from '@/utils/promptUtils'


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
    console.log("parts array before filter:", parts);
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

// fallback function: keep leading character tags (1boy/1girl/2boys/2girls) and then greedily add comma segments until within budgets
function fallbackTrimPreserveChars(text: string, maxW: number, maxC: number) {
  const { words: w0, commas: c0 } = countWordsAndCommas(text);
  // split into segments by comma (preserve trimmed segments)
  const segments = text.split(",").map(s => s.trim()).filter(Boolean);
  console.log("segments before filter:", segments);
  // ensure first segments containing '1boy' / '1girl' are preserved
  const preserved: string[] = [];
  const rest: string[] = [];

  // collect segments that look like character count tags first
  for (const seg of segments) {
    if (/^\s*(1boy|1girl|2boys|2girls)\b/i.test(seg)) {
      preserved.push(seg);
    } else {
      rest.push(seg);
    }
  }

  // now build result: start with preserved, then add rest until budgets satisfied
  const resultSegments = [...preserved];
  let curText = resultSegments.join(", ");
  let curCounts = countWordsAndCommas(curText);

  for (const seg of rest) {
    const candidate = curText ? `${curText}, ${seg}` : seg;
    const candCounts = countWordsAndCommas(candidate);
    if (candCounts.words <= maxW && candCounts.commas <= maxC) {
      resultSegments.push(seg);
      curText = candidate;
      curCounts = candCounts;
    } else {
      // stop when next segment would exceed budgets
      continue;
    }
  }
  return resultSegments.join(", ");
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripLeadingCounts(s: string) {
  // removes "1boy," "1girl," "2 characters," etc if it appears at the start
  return String(s || "")
    .replace(/^\s*(\d+\s*characters?|1boy|1girl|2boys|2girls)\s*,\s*/i, "")
    .trim();
}

function stripNameFromText(s: string, name?: string) {
  if (!name) return s;
  const re = new RegExp(`\\b${escapeRegExp(name)}\\b(?:'s)?`, "gi");
  return s.replace(re, " ").replace(/\s{2,}/g, " ").trim();
}

function normalizeTag(character: any) {
  // Best: store "1boy"/"1girl" in character.gender.
  const g = String(character?.gender || "").trim();
  if (/^(1boy|1girl|2boys|2girls)$/i.test(g)) return g.toLowerCase();
  // fallback: if description begins with "1boy," etc
  const d = String(character?.description || "").trim();
  const m = d.match(/^\s*(1boy|1girl|2boys|2girls)\b/i);
  if (m) return m[1].toLowerCase();
  return "person"; // last resort
}

function getCleanTraits(character: any) {
  const name = String(character?.name || "").trim();
  const raw = String(character?.description || "").trim();
  const noCount = stripLeadingCounts(raw);
  const noName = stripNameFromText(noCount, name);
  return noName.replace(/\s+/g, " ").trim();
}

// ✅ ONLY for multi-character formatting (keeps parentheses)
function buildCharacterAnchor(character: any) {
  const tag = normalizeTag(character);
  const traits = getCleanTraits(character);

  // no "role:" label anymore
  return `(${tag}: ${traits})`.replace(/\s+/g, " ").trim();
}

function stripNamesFromScene(scene: string, characters: any[]) {
  let s = String(scene || "");
  for (const c of characters || []) {
    const name = String(c?.name || "").trim();
    if (!name) continue;
    const re = new RegExp(`\\b${escapeRegExp(name)}\\b(?:'s)?`, "gi");
    s = s.replace(re, "");
  }
  return s.replace(/\s{2,}/g, " ").trim();
}

function stripAllCharacterNamesEverywhere(s: string, characters: any[]) {
  let out = String(s || "");

  // Remove known character names (and possessives) anywhere in the string
  for (const c of characters || []) {
    const name = String(c?.name || "").trim();
    if (!name) continue;
    const re = new RegExp(`\\b${escapeRegExp(name)}\\b(?:'s)?`, "gi");
    out = out.replace(re, " ");
  }

  // Cleanup spacing / commas
  out = out
    .replace(/\s{2,}/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/(^,|,$)/g, "")
    .trim();

  return out;
}

function filterCharactersMentionedInText(text: string, characters: any[] = []) {
  const t = (text || "").toLowerCase();
  return (characters || []).filter((c) => {
    const name = String(c?.name || "").trim().toLowerCase();
    if (!name) return false;
    return new RegExp(`\\b${escapeRegExp(name)}\\b`, "i").test(t);
  });
}

function pickPrimaryCharacterFromText(panelText: string, characters: any[]): any[] {
  const text = (panelText || "").toLowerCase();

  // Find earliest mention among known character names
  let best: { idx: number; c: any } | null = null;

  for (const c of characters || []) {
    const name = String(c?.name || "").trim();
    if (!name) continue;

    const i = text.indexOf(name.toLowerCase());
    if (i >= 0 && (best === null || i < best.idx)) {
      best = { idx: i, c };
    }
  }

  return best ? [best.c] : [];
}

// --- OUTFIT LOCK (no clothing word list needed) ---
// We only allow outfit-related phrases if they already appear in:
// - the panel script (payload.scene / cleanedScene)
// - the character descriptions (Airtable)
// Anything else is stripped from the prompt before sending to the image model.

function normalizeClause(s: string): string {
  return s
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .trim();
}

/**
 * Extract outfit-related clauses like:
 * - "wearing a yellow sundress"
 * - "dressed in a black suit"
 * - "in a white t-shirt and blue sweatpants" (ONLY when it follows "is/was/stands/sits/appears")
 * - "outfit: ..."
 * - "clothes: ..."
 *
 * We intentionally avoid needing a dictionary of clothing nouns.
 * (Yes, this may sometimes catch "wearing a smile" — we filter that out.)
 */
function extractOutfitClauses(text: string): string[] {
  const t = String(text || "");
  const clauses: string[] = [];

  // 1) wearing / dressed in / dressed as
  const reWear = /\b(?:wearing|wears|dressed in|dressed as)\s+([^.;\n]+)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = reWear.exec(t)) !== null) {
    clauses.push(normalizeClause(`wearing ${m[1]}`));
  }

  // 2) explicit labels: outfit/clothes/attire
  const reLabel = /\b(?:outfit|clothes|attire)\s*:\s*([^.;\n]+)/gi;
  while ((m = reLabel.exec(t)) !== null) {
    clauses.push(normalizeClause(`outfit: ${m[1]}`));
  }

  // 3) “is in a/an ...” patterns (guarded so we don’t grab random "in the room")
  // We only take it if it follows a describing verb (is/was/looks/appears/stands/sits)
  const reIn = /\b(?:is|was|looks|appears|standing|sitting)\s+in\s+(a|an)\s+([^.;\n]+)/gi;
  while ((m = reIn.exec(t)) !== null) {
    clauses.push(normalizeClause(`in a ${m[2]}`));
  }

  // filter common false positives
  const falsePositives = [
    "wearing a smile",
    "wearing a grin",
    "wearing an expression",
    "wearing a look",
  ];
  const filtered = clauses.filter(c => !falsePositives.some(fp => c.includes(fp)));

  return Array.from(new Set(filtered));
}

function buildAllowedOutfitSet(scene: string, characters: any[]): Set<string> {
  const allowed = new Set<string>();

  // Allow outfit clauses mentioned by the user in the panel text
  for (const c of extractOutfitClauses(scene)) allowed.add(c);

  // Allow outfit clauses mentioned in character descriptions (Airtable)
  for (const ch of (characters || [])) {
    for (const c of extractOutfitClauses(String(ch?.description || ""))) {
      allowed.add(c);
    }
  }

  return allowed;
}

/**
 * Remove any outfit clauses in generated text that aren't in allowed set.
 * If allowed set is empty => remove ALL outfit clauses (hard stop on invention).
 */
function stripDisallowedOutfitClauses(generated: string, allowed: Set<string>): string {
  let out = String(generated || "");

  // Strip wearing/dressed clauses
  out = out.replace(/\b(?:wearing|wears|dressed in|dressed as)\s+([^.;\n]+)\b/gi, (full, rest) => {
    const normalized = normalizeClause(`wearing ${rest}`);
    if (allowed.size === 0) return ""; // nothing allowed => strip all outfits
    return allowed.has(normalized) ? full : "";
  });

  // Strip outfit/clothes/attire labels
  out = out.replace(/\b(?:outfit|clothes|attire)\s*:\s*([^.;\n]+)/gi, (full, rest) => {
    const normalized = normalizeClause(`outfit: ${rest}`);
    if (allowed.size === 0) return "";
    return allowed.has(normalized) ? full : "";
  });

  // Strip "is in a ..." clauses
  out = out.replace(/\b(?:is|was|looks|appears|standing|sitting)\s+in\s+(a|an)\s+([^.;\n]+)/gi, (full, _a, rest) => {
    const normalized = normalizeClause(`in a ${rest}`);
    if (allowed.size === 0) return "";
    return allowed.has(normalized) ? full : "";
  });

  // cleanup
  out = out
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/(^\s*,\s*|\s*,\s*$)/g, "")
    .trim();

  return out;
}

function stripPeopleAndAppearanceishTagsForSingleChar(s: string) {
  let out = String(s || "");

  // remove common “person count” tags if they sneak in
  out = out.replace(/\b\d+\s*(girl|boy|people|characters)\b/gi, " ");
  out = out.replace(/\b1girl\b|\b1boy\b/gi, " ");

  // remove parenthetical blocks entirely (shouldn’t exist in single-char mode)
  out = out.replace(/\([^)]*\)/g, " ");

  // cleanup
  return out
    .replace(/\s{2,}/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/(^,|,$)/g, "")
    .trim();
}


// Added log to show the mapping for debugging
console.log("GRADIO_TO_REPLICATE_STYLE mapping:", GRADIO_TO_REPLICATE_STYLE);
export class AIService {
  private hf: HfInference;
  private readonly TEXT_MODEL = "black-forest-labs/FLUX.1-dev";
  private readonly TEXTER_MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1";
  private readonly COMPRESS_MODEL = "deepseek-ai/DeepSeek-V3.2-Exp";
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
      prompt: "hand-drawn ink lines",
      negative_prompt: "color, 3D, CGI, photorealistic, painterly, soft gradients, western comic style, deformed hands, deformed body parts, nsfw, lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality, watermark, unfinished, displeasing, oldest, early, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]"
    },
  
    "one-piece": {
      prompt: "one piece art style",
      negative_prompt: "photorealistic, 3D, CGI, hyperrealistic, blurred, low detail, child-like drawing, watermark, signature, duplicate heads, text errors, out-of-focus, poorly drawn anatomy, plain background, pastel art style, nsfw, lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality, watermark, unfinished, displeasing, oldest, early, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]"
    },
  
    "jujutsu-kaisen": {
      prompt: "jujutsu kaisen art style,",
      negative_prompt: "bright colors, overly simplified designs, clean digital look, soft pastels, cute expressions, deformed hands, deformed body parts, nsfw, lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality, watermark, unfinished, displeasing, oldest, early, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]"
    },
  
    "my-hero-academia": {
      prompt: "my hero academia art style,",
      negative_prompt: "realistic, washed-out tones, low detail, grayscale, horror style, deformed hands, deformed body parts, nsfw, lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality, watermark, unfinished, displeasing, oldest, early, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]"
    },
  
    "dandadan": {
      prompt: "dandadan art style, surreal atmosphere, eerie lighting, detailed linework,",
      negative_prompt: "orderly, too clean, flat linework, pastel tones, generic backgrounds, deformed hands, deformed body parts, nsfw, lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality, watermark, unfinished, displeasing, oldest, early, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]"
    },
  
    "quintessential-quintuplets": {
      prompt: "quintessential quintuplets art style, romantic atmosphere, clean thin line art,",
      negative_prompt: "dark themes, excessive contrast, rough inking, horror elements, strong shadows, deformed hands, deformed body parts, nsfw, lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality, watermark, unfinished, displeasing, oldest, early, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]"
    },
  
    "tokyo-revengers": {
      prompt: "tokyo revengers art style, thin line art,",
      negative_prompt: "clean, overly polished, soft shading, 3D rendering, overly detailed fantasy backgrounds, deformed hands, deformed body parts, nsfw, lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality, watermark, unfinished, displeasing, oldest, early, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]"
    },
  
    "comic-book": {
      prompt: "comic art style, bold black outlines, halftone texture, inked shading,",
      negative_prompt: "anime, watercolor, grayscale, painterly, photorealistic, manga, screentones, deformed hands, deformed body parts, nsfw, lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality, watermark, unfinished, displeasing, oldest, early, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]"
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

  // inside AIService class in aiService.ts - replace old compressPrompt with this
// replace existing compressPrompt with this
async compressPrompt(
  prompt: string,
  options?: { maxWords?: number; maxCommas?: number; allowParentheses?: boolean; noAppearance?: boolean;  }
): Promise<string> {
  const client = new InferenceClient(process.env.NEXT_PUBLIC_HF_TOKEN);

  // Base instruction — note we **conditionally** allow parentheses
  let systemInstruction = `
You are a prompt compression tool for AI image generation.
Convert a natural-language scene description into a concise, comma-separated list of visual tags under 77 tokens.
Output only the compressed scene, no explanations.
`;

 // ✅ NEW: single-character mode – ban appearance/clothing/hair/person-count
 if (options?.noAppearance) {
  systemInstruction += `
  CRITICAL RULES (NO APPEARANCE MODE):
- DO NOT mention clothing, outfit, dress, shoes, accessories.
- DO NOT mention hair style/color, eyes, face traits, body traits.
- DO NOT mention gender tags (1girl/1boy), character count, or names.
- ONLY include: action/pose, facial expression, environment/setting, camera/framing, lighting/mood.
- DO NOT invent new objects/wardrobe.
`.trim();
  }

  // If caller allows parentheses (for multi-character scenes), relax rule
  if (options?.allowParentheses) {
    systemInstruction += `
IMPORTANT: For multi-character scenes the output MAY include parenthetical character blocks in this exact format:
(1girl: traits...), (1boy: traits...), etc.
Keep parentheses, colons and inner commas ONLY for character descriptions. Otherwise produce comma-separated tags.
Do NOT output full sentences or explanatory text.
`;
  } else {
    systemInstruction += `
Formatting and Structure Rules:
1. Output pure comma-separated tags, no full sentences, no explanations, no line breaks.
2. Start with character count or character tag (1girl, 1boy) if present, and then tags.
3. Remove dialogue and quoted text, dedupe descriptors, keep under token budget.
4) Dedupe descriptors.
`;
  }

  // Append explicit budget instruction if provided
  if (options?.maxWords !== undefined || options?.maxCommas !== undefined) {
    const w = options.maxWords ?? 50;
    const c = options.maxCommas ?? 20;
    systemInstruction += `\n\nStrict budget: compress the scene to at most ${w} words and at most ${c} commas. Do NOT include art style or final style tags in this compressed scene output.`;
  }

  const chatCompletion = await client.chatCompletion({
    provider: "auto",
    model: this.COMPRESS_MODEL,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: `Prompt:\n${prompt}` }
    ],
    max_tokens: 120,
    temperature: 0.35,
    top_p: 0.9,
  });

  const output = chatCompletion?.choices?.[0]?.message?.content?.trim();
  if (!output) {
    throw new Error("Prompt compression failed or response malformed");
  }

  return output;
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
    
      const text = await res.text();
      let data: any = null;
      
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
      
      if (!res.ok) {
        console.error("Backend error response:", text);
        throw new Error((data && data.error) ? data.error : `Request failed: ${res.status}`);
      }
    
      const imageUrl = data.image.url;
      if (!data?.image?.url) {
        console.error("Malformed response:", data);
        throw new Error("Image generation failed: missing image.url");
      }
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

  async generateImageDescription(image: Blob): Promise<string | null> {
    try {
      const client = new InferenceClient(process.env.NEXT_PUBLIC_HF_TOKEN);
  
      const res = await client.imageToText({
        provider: "hf-inference", // ✅ key fix
        model: this.IMAGE_TO_TEXT_MODEL,
        data: image,
      });
  
      const text = (res as any)?.generated_text?.trim();
      if (!text) return null;
  
      return text
        .replace(/a (cartoon|anime|manga) of/gi, "")
        .replace(/[\-•]/g, "")
        .replace(/\([^)]*\)/g, "")
        .replace(/\b(character|person|woman|man)\b/gi, "")
        .substring(0, 300);
    } catch (err) {
      console.warn("Image captioning failed, returning null:", err);
      return null; // ✅ do NOT throw (you already handle null)
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
  seed: number; // ✅ added
  guidanceScale?: number;   // ✅ new
  isMangafy?: boolean;      // ✅ new
  customStyle?: string | null; // ✅ new
  previousPanelSummary?: string | null;
  narrativeIntent?: "establishing" | "dialogue" | "action" | "transition" | "hybrid";
  continuityMode?: "strict" | "loose" | "medium";
  lockEnvironment?: boolean;
  allowPoseChange?: boolean;
  transitionEnabled?: boolean; // ✅ add this
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
// --- transition semantics (default ON) ---
const transitionEnabled = payload.transitionEnabled !== false;

// If transition is OFF, only include characters explicitly mentioned in THIS panel's script text.
const rawPanelTextForMatching = String(payload.scene || cleanedScene || "");
const allChars = payload.characters || [];

const panelCharacters = transitionEnabled
  ? allChars
  : (
      // transition OFF: pick the primary character if possible
      pickPrimaryCharacterFromText(rawPanelTextForMatching, allChars).length > 0
        ? pickPrimaryCharacterFromText(rawPanelTextForMatching, allChars)
        : filterCharactersMentionedInText(rawPanelTextForMatching, allChars)
    );


// --- base setup ---
const negativePrompt = `${styleConfig.negative_prompt}, ${colorConfig.negative_prompt}`;
const styleSelector = GRADIO_TO_REPLICATE_STYLE[payload.gradioStyle] ?? "Anime";
const artStyleTag = styleConfig.prompt.trim();
let finalStylePromptTag = payload.customStyle
  ? payload.customStyle.trim()
  : (this.ART_STYLES[payload.style]?.prompt ?? "").trim();
  
// ✅ If Mangafy + one-piece style → append extra description
if (payload.isMangafy && payload.style === "one-piece") {
  finalStylePromptTag +=
    ", Black and white manga, high-contrast ink, clean linework, bold outlines, hatching, monochrome, Japanese aesthetic, dynamic";
}

if (payload.isMangafy && payload.style === "jujutsu-kaisen") {
  finalStylePromptTag +=
    ", Manga-style black & white illustration, distinct outfit, sharp lines, high-contrast shading, dramatic monochrome";
}

if (payload.isMangafy && payload.style === "my-hero-academia") {
  finalStylePromptTag +=
    ", black and white manga, high-contrast line art, screentone shading, expressive characters, dynamic poses, cinematic framing, minimal background, balanced light and dark";
}

if (payload.isMangafy && payload.style === "dandadan") {
  finalStylePromptTag +=
    ", High-contrast black-and-white manga style, expressive characters, detailed backgrounds, dramatic shading with cross-hatching, stippling, and screentones, cinematic composition, dark grayscale palette.";
}

if (payload.isMangafy && payload.style === "quintessential-quintuplets") {
  finalStylePromptTag +=
    ", Light slice-of-life manga style, clean black-and-white with soft grayscale, expressive characters, detailed backgrounds, minimal heavy blacks, mid-tone screentones, casual warm tone.";
}

if (payload.isMangafy && payload.style === "tokyo-revengers") {
  finalStylePromptTag +=
    ", Japanese manga style, black and white ink, sharp linework, screentone shading, expressive faces, dramatic close-ups, detailed backgrounds, cinematic composition, dark and gritty tone.";
}

if (artStyleTag) {
  finalStylePromptTag = finalStylePromptTag
    .replace(new RegExp(`\\b${escapeRegExp(artStyleTag)}\\b`, 'gi'), '') // strip exact phrase
    .replace(/\s*,\s*/g, ', ')         // normalize commas
    .replace(/(^,|,$)/g, '')           // trim leading/trailing commas
    .trim();
}

finalStylePromptTag = finalStylePromptTag ? finalStylePromptTag.trim() : "";

// --- prepare the scene that we WILL compress ---
// include character descriptions (if you pass them in payload.characters) so compressor can't drop them
// Build charactersText deterministically
const { wordBudget, commaBudget } = calculateBudget(`${artStyleTag}${finalStylePromptTag ? ", " + finalStylePromptTag : ""}`);

// Heuristic: if no characters were supplied but scene reads like "Name and Name are ...", create them.
// Put this BEFORE the existing block that builds charactersText.
if ((!Array.isArray((payload as any).characters) || (payload as any).characters.length === 0) && cleanedScene) {
  // match "Name and Name" (capitalized single-word names)
  const twoNamesMatch = cleanedScene.match(/\b([A-Z][a-z]+)\s+(?:and|&)\s+([A-Z][a-z]+)\b/);
  if (twoNamesMatch) {
    // set payload.characters so the later block uses it
    (payload as any).characters = [
      { gender: "1girl", description: twoNamesMatch[1] },
      { gender: "1boy",  description: twoNamesMatch[2] }
    ];
  } else {
    // try "Name, Name and Name" (pick first two names)
    const nameList = cleanedScene.match(/\b([A-Z][a-z]+)\b/g);
    if (nameList && nameList.length >= 2) {
      (payload as any).characters = [
        { gender: "1girl", description: nameList[0] },
        { gender: "1boy",  description: nameList[1] }
      ];
    }
  }
}

// --- Build character data ---
let charactersText = "";
if (Array.isArray(panelCharacters) && panelCharacters.length > 0) {
  if (panelCharacters.length === 1) {
    charactersText = getCleanTraits(panelCharacters[0]); // ✅ no parentheses, no label
  } else {
    const anchors = panelCharacters.map((c: any) =>
      buildCharacterAnchor(c)
    );
    charactersText = anchors.join(", ");

  }  
}

// We will NOT pass "comma separated tags" instruction — instead we allow parentheses.
let continuityHint = "";
if (transitionEnabled && payload.previousPanelSummary) {
  continuityHint = `
Previous panel visual context:
${payload.previousPanelSummary}

Maintain visual continuity (characters, pose, environment, mood).
`;
}

const nameStrippedScene = stripNamesFromScene(cleanedScene, panelCharacters);

let compressionInput = `
${continuityHint}
Scene: ${nameStrippedScene}
`.trim();

if (Array.isArray(panelCharacters) && panelCharacters.length > 1) {
  compressionInput = `
Describe each one using parentheses in this exact format:
(1girl: traits...), (1boy: traits...)
After describing them, describe their shared action and environment.

Characters:
${panelCharacters.map((c: any) => {
  const tag = normalizeTag(c);        // ✅ FIX: derive 1boy/1girl correctly
  const traits = getCleanTraits(c);   // ✅ FIX: removes the leading count + name
  return `- ${tag}: ${traits}`;
}).join("\n")}

Scene: ${nameStrippedScene}
`;
}
const isSingleCharacter = Array.isArray(panelCharacters) && panelCharacters.length === 1;
// --- compress ---
const compressedScene = await this.compressPrompt(compressionInput, {
  maxWords: wordBudget,
  maxCommas: commaBudget,
  allowParentheses: Array.isArray(panelCharacters) && panelCharacters.length > 1,
  noAppearance: isSingleCharacter, // ✅ NEW
});

let finalCompressed = compressedScene || "";
const allowedOutfits = buildAllowedOutfitSet(String(payload.scene || cleanedScene || ""), panelCharacters);
finalCompressed = stripDisallowedOutfitClauses(finalCompressed, allowedOutfits);
if (isSingleCharacter) {
  finalCompressed = stripPeopleAndAppearanceishTagsForSingleChar(finalCompressed);
}

// ✅ HARD ENFORCE: do not allow compressor to invent extra characters
// ✅ HARD ENFORCE: keep at most N parenthetical character blocks (no "N characters" label)
if (Array.isArray(panelCharacters) && panelCharacters.length > 1) {
  const expected = panelCharacters.length;
  const blocks = (finalCompressed.match(/\([^)]*:\s*[^)]*\)/g) || []);

  if (blocks.length > expected) {
    const kept = blocks.slice(0, expected);
    const withoutBlocks = finalCompressed
      .replace(/\([^)]*:\s*[^)]*\)/g, "")
      .replace(/\s*,\s*/g, ", ")
      .replace(/(^,|,$)/g, "")
      .trim();

    finalCompressed = `${kept.join(", ")}${withoutBlocks ? `, ${withoutBlocks}` : ""}`.trim();
  }
}

console.log("compressionInput:", compressionInput);
console.log("compressedScene (raw):", compressedScene);
console.log("finalCompressed (after fallback):", finalCompressed);

// --- ensure explicit count label for multi-character scenes ---


// If we expected multiple characters but compressor didn't return any parenthetical blocks,
// construct them deterministically from payload.characters.
if (Array.isArray(panelCharacters) && panelCharacters.length > 1 && !/\([^)]+:\s*[^)]+\)/.test(finalCompressed)) {
  const charParts = panelCharacters.map((c: any) => {
    // Use provided description if present, otherwise leave short placeholder like "unspecified appearance"
    const desc = (typeof c === "string" ? c : (c.description || "")).trim() || "unspecified appearance";
    const genderTag = normalizeTag(c); // ✅ fixes your 1girl/1boy flipping
    return `(${genderTag}: ${desc})`;
  });
  // Prepend explicit count label and the constructed character blocks, then append original compressed scene.
  finalCompressed = `${panelCharacters.length} characters, ${charParts.join(", ")}` + (finalCompressed ? `, ${finalCompressed}` : "");
}

// --- assemble prompt correctly ---
let assembledParts: string[] = [];
if (Array.isArray(panelCharacters) && panelCharacters.length > 1) {
  assembledParts = [artStyleTag, finalCompressed, finalStylePromptTag].filter(Boolean);
} else {
  assembledParts = [artStyleTag, charactersText, finalCompressed, finalStylePromptTag].filter(Boolean);
}
console.log("assembledParts before filter:", assembledParts);
const finalPromptRaw = (assembledParts || []).filter(Boolean).map(s => s.trim()).join(", ");
const finalPrompt = enforceNoDialogueAndStyle(finalPromptRaw, artStyleTag, finalStylePromptTag);
let shortenedPrompt = finalPrompt.trim();
    // -------------------- Mangafy: second-pass compression (replace existing block) --------------------
if (payload.isMangafy) {
  // Count current words/commas
  const totalCounts = countWordsAndCommas(shortenedPrompt);

  // If it's already within the stricter mangafy limits, skip
  if (totalCounts.words > 50 || totalCounts.commas > 20) {
    console.warn("⚠️ Mangafy prompt too long, re-compressing...");

    // Build the middle string to compress: remove artStyleTag and finalStylePromptTag
    // Use regex-safe escape
    const artEsc = escapeRegExp(artStyleTag || "");
    const finalEsc = escapeRegExp(finalStylePromptTag || "");

    // Remove the leading artStyleTag and trailing finalStylePromptTag from shortenedPrompt
    // (we'll compress only the middle)
    let middle = shortenedPrompt
      .replace(new RegExp(`^\\s*${artEsc}\\s*,?\\s*`, "i"), "")     // strip artStyle at start
      .replace(new RegExp(`,?\\s*${finalEsc}\\s*$`, "i"), "")     // strip finalStyle at end
      .trim();

    // If middle is empty (unexpected), fallback to the earlier compressedScene
    if (!middle) {
      // fallback to whichever scene text exists
      middle = compressedScene || cleanedScene || payload.scene || "";
    }
    

    // compute budgets so final overall words/comma <= 50/20
    const styleCounts = countWordsAndCommas(`${artStyleTag}${finalStylePromptTag ? ", " + finalStylePromptTag : ""}`);
    const remainingWordBudget = Math.max(1, 50 - styleCounts.words);   // at least 1
    const remainingCommaBudget = Math.max(0, 20 - styleCounts.commas); // can be 0

    // Run the compressor only on the middle with strict budgets
    let recompressedMiddle = await this.compressPrompt(middle, {
      maxWords: remainingWordBudget,
      maxCommas: remainingCommaBudget
    });

    // If compressor returned empty or included style fragments, strip them again
    if (recompressedMiddle) {
      // ensure it does NOT contain art/final style phrases
      if (artStyleTag) recompressedMiddle = recompressedMiddle.replace(new RegExp(escapeRegExp(artStyleTag), "gi"), "");
      if (finalStylePromptTag) recompressedMiddle = recompressedMiddle.replace(new RegExp(escapeRegExp(finalStylePromptTag), "gi"), "");
      recompressedMiddle = recompressedMiddle.replace(/(^,|,$)/g, "").trim();
    }

    // Deterministic fallback trimming if still too big (model sometimes ignores strictness)
    const recombinedAttempt = `${artStyleTag}${recompressedMiddle ? ", " + recompressedMiddle : ""}${finalStylePromptTag ? ", " + finalStylePromptTag : ""}`.trim();
    const attemptCounts = countWordsAndCommas(recombinedAttempt);
    if (attemptCounts.words > 50 || attemptCounts.commas > 20) {
      console.warn("⚠️ Re-compressed still too long, applying deterministic trim fallback.");

      // compute necessary budgets for middle (same calculation as before)
      const trimmedMiddle = fallbackTrimPreserveChars(
        recompressedMiddle || middle,
        Math.max(1, 50 - styleCounts.words),
        Math.max(0, 20 - styleCounts.commas)
      );

      recompressedMiddle = trimmedMiddle;
    }

    // Reassemble
    let reassembled = artStyleTag;
    if (recompressedMiddle) reassembled += `, ${recompressedMiddle}`;
    if (finalStylePromptTag) reassembled += `, ${finalStylePromptTag}`;

    // Final enforcement & cleaning
    shortenedPrompt = enforceNoDialogueAndStyle(reassembled, artStyleTag, finalStylePromptTag).trim();

    console.log("✅ Mangafy re-compressed final prompt:", shortenedPrompt);
  } // end if too-long
} // end if payload.isMangafy
// -------------------- end Mangafy block --------------------

    // optional: debug/log length & commas
    console.log("Final prompt:", shortenedPrompt);
    console.log("Words:", shortenedPrompt.split(/\s+/).length, "Commas:", (shortenedPrompt.match(/,/g)||[]).length);
    
    
      // Replace HF calls with Gradio integration
      const blob = await aiService.generateTextToImageReplicate({
        prompt: shortenedPrompt,
        negative_prompt: negativePrompt,
        width: payload.width!,
        height: payload.height!,
        cfg_scale: payload.guidanceScale,  // ✅ dynamic
        steps: 28,
        seed: payload.seed,
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

    
      return data.panels.map((panel: any) => ({
        scene: String(panel.scene || "").trim(),
        camera: String(panel.camera || "").trim(),
        dialogue: String(panel.dialogue || "").trim(),
      }));
      
      

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