// promptUtils.ts
export function countWordsAndCommas(text: string) {
  const trimmed = (text || "").trim();
  if (!trimmed) return { words: 0, commas: 0 };
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const commas = (trimmed.match(/,/g) || []).length;
  return { words, commas };
}

/**
 * Given style text (art style + styleTags), compute remaining budget
 * based on maxWords and maxCommas defaults (50 words, 20 commas).
 */
export function calculateBudget(styleText: string, maxWords = 50, maxCommas = 20) {
  const { words, commas } = countWordsAndCommas(styleText || "");
  return {
    wordBudget: Math.max(0, maxWords - words),
    commaBudget: Math.max(0, maxCommas - commas)
  };
}

/**
 * Enforce no dialogue and handle style placement.
 * - artStyleMustStart: the main art-style tag string that MUST be at the front
 * - finalStyleTags: optional additional style tags (mangafy extras) that MUST be at the end
 *
 * This function:
 * - removes quoted dialog
 * - collapses duplicate character tags into 2boys/2girls where appropriate
 * - deduplicates style phrases and places artStyleMustStart at the START
 * - places finalStyleTags (if provided) at the END
 */
export function enforceNoDialogueAndStyle(
  compressed: string,
  artStyleMustStart: string,
  finalStyleTags?: string
): string {
  let cleaned = (compressed || "").replace(/["“”‘’][^"“”‘’]*["“”‘’]/g, "");

  // Normalize whitespace & commas
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // --- Fix duplicate character tags ---
  const hasBoy = /\b1boy\b/i.test(cleaned);
  const hasGirl = /\b1girl\b/i.test(cleaned);

  if (hasBoy && hasGirl) {
    // Remove any occurrences so we can reinject in canonical order
    cleaned = cleaned.replace(/\b1boy\b\s*,?/gi, "").replace(/\b1girl\b\s*,?/gi, "").trim();
    cleaned = `1boy, 1girl, ${cleaned}`;
  } else if (/(\b1boy\b.*\b1boy\b)/i.test(cleaned)) {
    cleaned = cleaned.replace(/\b1boy\b\s*,?/gi, "").trim();
    cleaned = `2boys, ${cleaned}`;
  } else if (/(\b1girl\b.*\b1girl\b)/i.test(cleaned)) {
    cleaned = cleaned.replace(/\b1girl\b\s*,?/gi, "").trim();
    cleaned = `2girls, ${cleaned}`;
  }

  // Remove any occurrences of the artStyleMustStart and finalStyleTags inside the middle
  if (artStyleMustStart) {
    const escStart = artStyleMustStart.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regexStart = new RegExp(`,?\\s*${escStart}`, "gi");
    cleaned = cleaned.replace(regexStart, "").trim();
  }
  if (finalStyleTags) {
    const escEnd = finalStyleTags.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regexEnd = new RegExp(`,?\\s*${escEnd}`, "gi");
    cleaned = cleaned.replace(regexEnd, "").trim();
  }

  // Remove repeated commas, leading/trailing commas and whitespace
  cleaned = cleaned.replace(/\s*,\s*/g, ", ").replace(/(^,|,$)/g, "").trim();

  // --- Re-assemble: artStyleMustStart first, then cleaned middle, then finalStyleTags last ---
  const parts: string[] = [];
  if (artStyleMustStart && artStyleMustStart.trim()) {
    parts.push(artStyleMustStart.trim());
  }
  if (cleaned) {
    parts.push(cleaned);
  }
  if (finalStyleTags && finalStyleTags.trim()) {
    parts.push(finalStyleTags.trim());
  }

  // join and ensure single commas between parts
  const result = parts.join(", ").replace(/\s*,\s*/g, ", ").trim();
  return result;
}
