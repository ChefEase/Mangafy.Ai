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

  // === Step A: extract and temporarily replace parenthetical blocks ===
  const parenBlocks: string[] = [];
  cleaned = cleaned.replace(/\([^)]*\)/g, (m) => {
    parenBlocks.push(m); // store including parentheses
    return `__PAREN_${parenBlocks.length - 1}__`;
  });

  // === Step B: operate on the outside text only ===
  // Remove occurrences of artStyleMustStart and finalStyleTags outside parentheses
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

  // Fix duplicate character tags outside parentheses only
  const hasBoyOutside = /\b1boy\b/i.test(cleaned);
  const hasGirlOutside = /\b1girl\b/i.test(cleaned);

  if (hasBoyOutside && hasGirlOutside) {
    cleaned = cleaned.replace(/\b1boy\b\s*,?/gi, "").replace(/\b1girl\b\s*,?/gi, "").trim();
    cleaned = `1boy, 1girl, ${cleaned}`.trim();
  } else if (/(\b1boy\b.*\b1boy\b)/i.test(cleaned)) {
    cleaned = cleaned.replace(/\b1boy\b\s*,?/gi, "").trim();
    cleaned = `2boys, ${cleaned}`;
  } else if (/(\b1girl\b.*\b1girl\b)/i.test(cleaned)) {
    cleaned = cleaned.replace(/\b1girl\b\s*,?/gi, "").trim();
    cleaned = `2girls, ${cleaned}`;
  }

  // Remove repeated commas, leading/trailing commas and whitespace (outside parens)
  cleaned = cleaned.replace(/\s*,\s*/g, ", ").replace(/(^,|,$)/g, "").trim();

  // === Step C: restore parentheses blocks back in place ===
  cleaned = cleaned.replace(/__PAREN_(\d+)__/g, (_, idx) => parenBlocks[Number(idx)] || "");

  // === Step D: Re-assemble: artStyle first, then cleaned middle, then final style tags last ===
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

  const result = parts.join(", ").replace(/\s*,\s*/g, ", ").trim();
  return result;
}
