"use client";

import React, { memo } from "react";
import ScriptEditor from "../ScriptEditor/ScriptEditor";

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