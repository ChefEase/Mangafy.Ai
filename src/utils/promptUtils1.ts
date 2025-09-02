
export function enforceNoDialogueAndStyle(compressed: string, styleTag: string): string {
    // Remove leftover dialogue-looking segments with quotes or keywords
    let cleaned = compressed.replace(/["“”‘’][^"“”‘’]*["“”‘’]/g, "");
    // Ensure art style tag is present
    if (!cleaned.toLowerCase().includes(styleTag.toLowerCase())) {
      cleaned = `${styleTag}, ${cleaned}`;
    }
    return cleaned;
  }
  