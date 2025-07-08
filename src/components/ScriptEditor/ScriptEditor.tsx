"use client";

import React, { useRef, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "./ScriptEditor.css";
import mammoth from "mammoth";
import { validateScript } from "../../utils/scriptValidation";

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
  const quillRef = useRef<Quill | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [message, setMessage] = useState("");
  const isQuillInitialized = useRef(false); // Track Quill initialization
  const isInitialContentSet = useRef(false); // Add this ref

  useEffect(() => {
    if (editorRef.current && !isQuillInitialized.current) {
      console.log("Initializing Quill"); // Debugging
      isQuillInitialized.current = true; // Mark Quill as initialized

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

      // Load saved content or selected template
      const savedScript = localStorage.getItem(LOCAL_STORAGE_KEY);
      const selectedTemplate = localStorage.getItem("selected-template");
      const initialHtml = selectedTemplate || savedScript || initialContent;

       
      if (initialHtml) {
        const delta = quillRef.current.clipboard.convert({ html: initialHtml });
        quillRef.current.setContents(delta, 'silent');
        isInitialContentSet.current = true;
      }

      if (selectedTemplate) {
        quillRef.current.clipboard.dangerouslyPasteHTML(selectedTemplate);
        localStorage.removeItem("selected-template"); // Clear the template after loading
      } else if (savedScript) {
        quillRef.current.clipboard.dangerouslyPasteHTML(savedScript);
      } else if (initialContent) {
        quillRef.current.clipboard.dangerouslyPasteHTML(initialContent);
      }

      // Handle content changes
      const handleTextChange = () => {
        const newContent = quillRef.current?.root.innerHTML || "";
        onContentChange(newContent);
      };

      quillRef.current.on('text-change', (delta, oldDelta, source) => {
        if (source === 'user') {
          const newContent = quillRef.current?.root.innerHTML || '';
          onContentChange(newContent);
        }
      });

      // Cleanup Quill instance on unmount
      return () => {
        if (quillRef.current) {
          quillRef.current.off('text-change');
          quillRef.current = null;
          isQuillInitialized.current = false;
          const toolbar = document.querySelector(".ql-toolbar");
          toolbar?.remove();
        }
      };
    }
  }, []); // Empty dependency array ensures this runs only once

  // Update Quill content when initialContent changes
  useEffect(() => {
    if (quillRef.current && content !== quillRef.current.root.innerHTML) {
      const delta = quillRef.current.clipboard.convert({ html: content });
      quillRef.current.setContents(delta, 'silent');
    }
  }, [content]);
  
  const handleSave = () => {
    if (quillRef.current) {
      const currentContent = quillRef.current.root.innerHTML.trim();

      // Validate the script
      const errors = validateScript(currentContent);
      if (errors.length > 0) {
        setMessage(errors[0]); // Show validation error
        return; // Stop save if script is too short
      }

      // Save content to localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, currentContent);
      setMessage("Script saved successfully!"); // Show success message

      // Clear message after 2 seconds
      setTimeout(() => setMessage(""), 2000);
    }
    onSave();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileContent = e.target?.result as string;

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