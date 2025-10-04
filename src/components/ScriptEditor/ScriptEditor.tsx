"use client";

import React, { useRef, useEffect, useState } from "react";
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

      // Prefer content from parent; otherwise fallback to saved or initial
      const savedScript = localStorage.getItem(LOCAL_STORAGE_KEY);
      const initialHtml =
        (content && content.trim()) ||
        (savedScript && savedScript.trim()) ||
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

  // Update editor if parent content changes (and differs)
  useEffect(() => {
    if (!quillRef.current) return;
    // Avoid wiping content with empty string
    if (!content || !content.trim()) return;

    const current = quillRef.current.root.innerHTML;
    if (content !== current) {
      quillRef.current.clipboard.dangerouslyPasteHTML(content);
    }
  }, [content]);

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

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        const text = result.value;
        quillRef.current?.setText(text);
      } else if (file.type === "application/pdf") {
        alert("PDF import is not yet supported. Please use a .docx file.");
      } else {
        alert("Unsupported file type. Please upload a .docx file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="script-editor">
      <div ref={editorRef} id="quill-editor"></div>
      <button onClick={handleSave}>Save Script</button>
      {message && <p className="save-message">{message}</p>}
      <input type="file" accept=".docx, .pdf" onChange={handleFileImport} />
    </div>
  );
};

export default ScriptEditor;
