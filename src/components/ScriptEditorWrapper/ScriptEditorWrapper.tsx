"use client";

import React, { memo, useEffect } from "react";
import ScriptEditor from "../ScriptEditor/ScriptEditor";

export function UseStableViewportHeight() {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--app-vh", `${vh}px`);
    };
    setVH();
    window.addEventListener("resize", setVH);
    return () => window.removeEventListener("resize", setVH);
  }, []);

  return null;
}

interface ScriptEditorWrapperProps {
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  initialContent?: string;
}

const ScriptEditorWrapper: React.FC<ScriptEditorWrapperProps> = memo(({
  content,
  onContentChange,
  onSave,
  initialContent,
}) => {
  return (
    <ScriptEditor
      content={content}
      onContentChange={onContentChange}
      onSave={onSave}
      initialContent={initialContent}
    />
  );
});

export default ScriptEditorWrapper;