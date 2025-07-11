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
  const isInitialContentSet = useRef(false);
  const [message, setMessage] = useState("");  
  // Dynamically import Quill on client-side only
  useEffect(() => {
    import("quill").then((module) => {
      console.log("Quill module loaded:", module);
      const QuillConstructor = module?.default ?? module;
      setQuill(() => QuillConstructor);
    });
  }, []);

  // Initialize Quill when Quill module is loaded
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

      // Your existing content loading and event setup goes here
      const savedScript = localStorage.getItem(LOCAL_STORAGE_KEY);
      const selectedTemplate = localStorage.getItem("selected-template");
      const initialHtml = selectedTemplate || savedScript || initialContent;

      if (initialHtml) {
        const delta = quillRef.current.clipboard.convert({ html: initialHtml });
        quillRef.current.setContents(delta, "silent");
        isInitialContentSet.current = true;
      }

      if (selectedTemplate) {
        quillRef.current.clipboard.dangerouslyPasteHTML(selectedTemplate);
        localStorage.removeItem("selected-template");
      } else if (savedScript) {
        quillRef.current.clipboard.dangerouslyPasteHTML(savedScript);
      } else if (initialContent) {
        quillRef.current.clipboard.dangerouslyPasteHTML(initialContent);
      }

      quillRef.current.on("text-change", (delta: Delta, oldDelta: Delta, source: Sources) => {
        if (source === "user") {
          const newContent = quillRef.current?.root.innerHTML || "";
          onContentChange(newContent);
        }
      });

      return () => {
        if (quillRef.current) {
          quillRef.current.off("text-change");
          quillRef.current = null;
          isQuillInitialized.current = false;
          const toolbar = document.querySelector(".ql-toolbar");
          toolbar?.remove();
        }
      };
    }
  }, [Quill]);

  // Update Quill content when `content` changes externally
  useEffect(() => {
    if (quillRef.current && content !== quillRef.current.root.innerHTML) {
      const delta = quillRef.current.clipboard.convert({ html: content });
      quillRef.current.setContents(delta, "silent");
    }
  }, [content]);

  // Your save and file import handlers stay the same...

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
    reader.onload = async (e) => {
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
