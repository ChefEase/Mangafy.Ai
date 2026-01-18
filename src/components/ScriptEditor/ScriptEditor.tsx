"use client";

import React, { useRef, useEffect, useState } from "react";
import "quill/dist/quill.snow.css";
import "./ScriptEditor.css";
import mammoth from "mammoth";
import { validateScript } from "../../utils/scriptValidation";
import type * as QuillNamespace from "quill";

type Delta = QuillNamespace.Delta;
type Sources = "user" | "api" | "silent";

interface ScriptEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  initialContent?: string;
}

const LOCAL_STORAGE_KEY = "saved-script";

const ScriptEditor: React.FC<ScriptEditorProps> = ({
  content,
  onContentChange,
  onSave,
  initialContent = "",
}) => {
  const [Quill, setQuill] = useState<any>(null);
  const quillRef = useRef<any>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const isQuillInitialized = useRef(false);
  const [message, setMessage] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [showPanel, setShowPanel] = useState(false);

  // Load Quill
  useEffect(() => {
    import("quill").then((module) => {
      const QuillConstructor = module?.default ?? module;
      setQuill(() => QuillConstructor);
    });
  }, []);

  // Init Quill
  useEffect(() => {
    if (Quill && editorRef.current && !isQuillInitialized.current) {
      isQuillInitialized.current = true;

      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["clean"],
          ],
        },
        placeholder: "Write your script here...",
      });

      // Load existing content
      const initialHtml =
        (content && content.trim()) ||
        (initialContent && initialContent.trim()) ||
        "";

      if (initialHtml) {
        quillRef.current.clipboard.dangerouslyPasteHTML(initialHtml);
      }

      quillRef.current.on(
        "text-change",
        (_delta: Delta, _old: Delta, source: Sources) => {
          if (source === "user") {
            const newContent = quillRef.current?.root.innerHTML || "";
            onContentChange(newContent);
          }
        }
      );

      return () => {
        if (quillRef.current) {
          quillRef.current.off("text-change");
          quillRef.current = null;
          isQuillInitialized.current = false;
          document.querySelector(".ql-toolbar")?.remove();
        }
      };
    }
  }, [Quill]); // eslint-disable-line

  // Update editor when parent changes
  useEffect(() => {
    if (!quillRef.current) return;
    const current = quillRef.current.root.innerHTML;
    if (content !== current) {
      quillRef.current.clipboard.dangerouslyPasteHTML(content || "");
    }
  }, [content]);
  

  // === SAVE SCRIPT ===
  const handleSave = () => {
    if (quillRef.current) {
      const currentContent = quillRef.current.root.innerHTML.trim();
      const errors = validateScript(currentContent);
      if (errors.length > 0) {
        setMessage(errors[0]);
        return;
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, currentContent);
      setMessage("Script saved successfully!");
      setTimeout(() => setMessage(""), 2000);
    }
    onSave();
  };

  // === FILE IMPORT ===
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        const text = result.value;
        quillRef.current?.setText(text);
      } else {
        alert("Please upload a .docx file only.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // === RECOMMENDATION LOGIC ===
  const handleRecommendSettings = () => {
    const storyText = quillRef.current?.getText().trim().toLowerCase() || "";
    if (!storyText) {
      setRecommendations(["✏️ Please type your story first."]);
      setShowPanel(true);
      return;
    }
  
    const recs: string[] = [];

    // === STYLE PRESET ===
// === STYLE PRESET ===
let stylePreset: string = "Manga"; // default baseline

// Manga — expressive storytelling, dialogue-heavy, traditional tone
if (/story|dialogue|speech|expression|comic|narration|emotion|dramatic|hand drawn/i.test(storyText)) {
  stylePreset = "Manga";
}

// Cinematic — grand, epic, film-like
else if (/cinematic|film|scene|montage|epic|heroic|sweeping|climax|theme|motion|drama/i.test(storyText)) {
  stylePreset = "Cinematic";
}

// Photographic — realism, lighting focus, visual accuracy
else if (/photo|realistic|portrait|lighting|detailed|focus|depth|realism|capture|reflection|shadow/i.test(storyText)) {
  stylePreset = "Photographic";
}

// Anime — emotional, colorful, vibrant, expressive faces
else if (/anime|cute|romance|love|school|slice of life|smile|friendship|laugh|blush/i.test(storyText)) {
  stylePreset = "Anime";
}

// Digital Art — modern, sleek, fantasy-tech vibe
else if (/digital|modern|sci-fi|tech|cyber|futuristic|hologram|interface|high tech|ai/i.test(storyText)) {
  stylePreset = "Digital Art";
}

// Pixel Art — retro, nostalgic, game-like visuals
else if (/pixel|8-bit|retro|game|arcade|old school|sprite|lowres/i.test(storyText)) {
  stylePreset = "Pixel Art";
}

// Fantasy Art — magic, creatures, adventure, medieval
else if (/fantasy|magic|dragon|kingdom|sword|quest|witch|castle|myth|rune/i.test(storyText)) {
  stylePreset = "Fantasy Art";
}

// Neonpunk 3D Model — cyberpunk, urban chaos, tech dystopia
else if (/neon|cyberpunk|future|city|nightlife|lights|3d|render|model|punk|metaverse/i.test(storyText)) {
  stylePreset = "Neonpunk 3D Model";
}

recs.push(`🧩 Recommended Style Preset: ${stylePreset}`);

    // === PANEL RECOMMENDATION ===
    const panelCount = (storyText.match(/in the (first|second|third|fourth) panel/g) || []).length;
    let panelSuggestion = "";
  
    // Context detection
    const isAction = /fight|battle|punch|attack|sword|explosion|power|run|impact|clash/i.test(storyText);
    const isRomance = /kiss|love|romantic|hug|heart|blush|confession/i.test(storyText);
    const isDialogue = /said|asked|reply|conversation|talk|dialogue/i.test(storyText);
    const isMystery = /dark|shadow|mystery|investigate|crime|noir|detective/i.test(storyText);
    const isEmotional = /cry|tears|sad|heartfelt|goodbye|alone|memory/i.test(storyText);
    const isComedy = /laugh|funny|joke|silly|embarrassed/i.test(storyText);
    const isScenic = /landscape|sunset|city|mountain|sky|scene/i.test(storyText);
  
    if (panelCount === 1) {
      if (isEmotional || isScenic || isRomance) {
        panelSuggestion =
          "🌇 Single full-page panel — perfect for emotional or scenic emphasis.";
      } else if (isAction) {
        panelSuggestion =
          "⚡ Full-bleed single panel — use wide framing to capture the motion and impact.";
      } else {
        panelSuggestion =
          "🖼️ Single panel — best for strong moments or establishing shots.";
      }
    }
  
    else if (panelCount === 2) {
      if (isAction) {
        panelSuggestion =
          "🔥 Two **vertical** panels — emphasize fast-paced motion or direct character clashes.";
      } else if (isDialogue) {
        panelSuggestion =
          "💬 Two **horizontal** panels — best for back-and-forth conversations or visual contrast.";
      } else if (isRomance) {
        panelSuggestion =
          "❤️ Two **horizontal** panels — good for emotional exchanges or mirrored expressions.";
      } else if (isMystery) {
        panelSuggestion =
          "🌒 Two **vertical** panels — great for showing light vs. shadow or dual perspectives.";
      } else {
        panelSuggestion =
          "🖼️ Two-panel layout (horizontal or vertical depending on pacing).";
      }
    }
  
    else if (panelCount === 3) {
      if (isAction) {
        panelSuggestion =
          "💥 Three-panel (2 vertical + 1 horizontal) — dynamic layout for sequential action or buildup.";
      } else if (isDialogue) {
        panelSuggestion =
          "💬 Three **horizontal** panels — ideal for continuous dialogue or gradual emotional shifts.";
      } else if (isMystery) {
        panelSuggestion =
          "🕵️ Three-panel (1 horizontal + 2 vertical) — helps alternate clues and reactions.";
      } else if (isRomance || isEmotional) {
        panelSuggestion =
          "🌹 Three-panel (horizontal) — graceful pacing for emotional storytelling.";
      } else {
        panelSuggestion =
          "📖 Three-panel layout — balanced visual rhythm for narrative progression.";
      }
    }
  
    if (panelSuggestion) recs.push(panelSuggestion);
  
    // === ART STYLE ===
let artStyle: string | null = null;

// --- Adventure / Comedy / Friendship (One Piece) ---
if (/adventure|journey|crew|island|pirate|funny|laugh|friendship|dream/i.test(storyText)) {
  artStyle = "One Piece (expressive, comedic yet emotional adventure style)";
}

// --- Dark Fantasy / Curses / Supernatural Battles (Jujutsu Kaisen) ---
else if (/curse|demon|dark|supernatural|exorcist|haunt|spirit|fight to death|fear/i.test(storyText)) {
  artStyle = "Jujutsu Kaisen (gritty, fluid, supernatural combat aesthetic)";
}

// --- Heroism / Power / Society / Training (My Hero Academia) ---
else if (/hero|villain|power|quirk|school|rescue|justice|training|mentor/i.test(storyText)) {
  artStyle = "My Hero Academia (clean lines, dynamic poses, youthful energy)";
}

// --- Modern Sci-Fi / Paranormal / Chaos (Dandadan) ---
else if (/alien|ghost|weird|chaos|futuristic|modern|urban|comedy|paranormal/i.test(storyText)) {
  artStyle = "Dandadan (chaotic modern aesthetic — high contrast, quirky energy)";
}

// --- Romance / Slice of Life / Comedy Drama (Quintessential Quintuplets) ---
else if (/romance|love|school|date|heart|blush|cute|sweet|relationship/i.test(storyText)) {
  artStyle = "Quintessential Quintuplets (soft pastel tones, charming romantic style)";
}

// --- Gang / Street / Revenge / Flashback (Tokyo Revengers) ---
else if (/gang|fight|revenge|past|flashback|crime|motorcycle|time travel/i.test(storyText)) {
  artStyle = "Tokyo Revengers (gritty modern realism with emotional flashback tone)";
}

// --- Western / Hero vs Villain / City Action (Comic Book) ---
else if (/superhero|city|crime|villain|marvel|dc|cape|justice league|avengers/i.test(storyText)) {
  artStyle = "Comic Book (Marvel/DC) — bold lines, dramatic shadows, Western pacing)";
}

// --- Custom fallback if none of the above match ---
else {
  // Generate a random "custom" variant name so it feels organic
  const customVariants = [
    "Dragon Ball Z (energetic hatching & motion lines)",
    "Berserk (detailed hatching & dark tone)",
    "Chainsaw Man (chaotic sketch realism)",
    "Spy x Family (clean modern cinematic linework)",
    "Made in Abyss (fantasy detailed style)",
  ];
  const randomCustom = customVariants[Math.floor(Math.random() * customVariants.length)];
  artStyle = `Custom Art Style — ${randomCustom}`;
}

recs.push(`🎨 Recommended Art Style: ${artStyle}`);

    // === MOOD / LIGHTING ===
let mood: string = "none";

// --- Noir: crime, mystery, tension, darkness ---
if (/noir|crime|detective|dark|shadow|night|murder|city alley|rainy|cigarette|lonely/i.test(storyText)) {
  mood = "noir";
}

// --- Sunset: romantic, reflective, peaceful ---
else if (/sunset|evening|romantic|love|kiss|farewell|beach|orange sky|goodbye|dusk/i.test(storyText)) {
  mood = "sunset";
}

// --- Dramatic Shadows: conflict, emotion, revelation, battle ---
else if (/dramatic|intense|confrontation|fight|battle|power|anger|scream|rage|impact|tense/i.test(storyText)) {
  mood = "dramatic shadows";
}

// --- Cool Blue: calm, mystery, futuristic, isolation ---
else if (/cold|futuristic|ocean|night sky|technology|robot|space|rain|calm|lonely/i.test(storyText)) {
  mood = "cool blue";
}

// --- Warm Glow: joy, morning, happiness, hope ---
else if (/happy|smile|bright|morning|sunrise|hope|family|friendship|laugh|cheerful/i.test(storyText)) {
  mood = "warm glow";
}

// --- Vintage: nostalgia, memory, flashback, past ---
else if (/nostalgic|flashback|memory|past|old|childhood|village|sepia|retro/i.test(storyText)) {
  mood = "vintage";
}

// --- Neon Lights: cityscape, cyberpunk, nightlife, chaos ---
else if (/neon|city|cyberpunk|street|signs|nightlife|club|lights|future|urban/i.test(storyText)) {
  mood = "neon lights";
}

// --- Cinematic: movie-like, slow motion, hero moment ---
// --- Cinematic: movie-like, grand, emotional climax ---
else if (/film|cinematic|epic|heroic|grand|slow motion|climax|montage|theme|sweeping|dramatic entrance/i.test(storyText)) {
  mood = "cinematic";
}

// Add result
if (mood === "none") {
  recs.push("💡 Recommended Mood/Lighting: None (no specific mood needed for this scene).");
} else {
  recs.push(`💡 Recommended Mood/Lighting: ${mood}`);
}

    // === COLOR OPTION ===
let colorOption: string = "Black and White";

// Full Color — vibrant, modern, emotional, vivid, fantastical
if (/color|colored|vivid|bright|sunrise|sunset|glow|neon|city|lights|magic|fantasy|festival|dream|modern|digital|day|cheerful/i.test(storyText)) {
  colorOption = "Full Color";
}

// Black and White — classic manga tone, nostalgic, serious, dark, sketchy
else if (/sketch|ink|classic|old|noir|shadow|rain|crime|flashback|vintage|melancholy|lonely|grayscale/i.test(storyText)) {
  colorOption = "Black and White";
}

recs.push(`🎨 Recommended Color Option: ${colorOption}`);

    setRecommendations(recs);
    setShowPanel(true);
  };
  

  return (
    <div className="script-editor">
      <div ref={editorRef} id="quill-editor"></div>
      <button onClick={handleSave}>Save Script</button>
      {message && <p className="save-message">{message}</p>}
      <input type="file" accept=".docx, .pdf" onChange={handleFileImport} />

      {/* Recommendation trigger */}
      <div className="recommendationTrigger">
        <button
          className="recommendButton"
          onClick={handleRecommendSettings}
          title="Get recommendations based on your story"
        >
          <span className="glowIcon">❓</span> Recommended Settings
        </button>
      </div>

      {/* Recommendation Panel */}
      {showPanel && (
        <div className="recommendationPanel">
          <h3>✨ AI Recommendations</h3>
          <ul>
            {recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
          <button className="closeRecPanel" onClick={() => setShowPanel(false)}>
            ✖ Close
          </button>
        </div>
      )}
    </div>
  );
};

export default ScriptEditor;
