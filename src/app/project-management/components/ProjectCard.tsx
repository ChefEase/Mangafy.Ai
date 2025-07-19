import React, { useState, useRef } from "react";

interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  chapters: { id: string; title: string }[];
}

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  onCreateChapter: (projectId: string, chapterTitle: string) => void;
  onRenameProject: (projectId: string, newTitle: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export default function ProjectCard({
  project,
  onSelect,
  onCreateChapter,
  onRenameProject,
  onDeleteProject,
}: ProjectCardProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<number | null>(null);

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return; // Only single touch
    const touch = e.touches[0];

    longPressTimer.current = window.setTimeout(() => {
      setContextMenuPosition({ x: touch.clientX, y: touch.clientY });
      setShowContextMenu(true);
    }, 600); // 600ms for long press
  };

  // Cancel long press if touch ends or moves
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchEnd = () => {
    cancelLongPress();
  };

  const handleTouchMove = () => {
    cancelLongPress();
  };

  const handleAddChapter = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const chapterTitle = prompt("Enter the chapter title:");
    if (chapterTitle) {
      onCreateChapter(project.id, chapterTitle);
    }
    setShowContextMenu(false);
  };

  const handleRename = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const newTitle = prompt("Enter the new project title:", project.title);
    if (newTitle) {
      onRenameProject(project.id, newTitle);
    }
    setShowContextMenu(false);
  };

  const handleDeleteProject = (e: React.MouseEvent | React.TouchEvent, projectId: string) => {
    e.stopPropagation();
    const confirmDelete = window.confirm("Are you sure you want to delete this project?");
    if (confirmDelete) {
      onDeleteProject(projectId);
    }
  };

  return (
    <div className="project-card" 
    onClick={() => onSelect(project)} 
    onContextMenu={handleRightClick}
    onTouchStart={handleTouchStart}
    onTouchEnd={handleTouchEnd}
    onTouchMove={handleTouchMove}

    >
      <img src={project.thumbnail} alt={project.title} />
      <h3>{project.title}</h3>
      <p>{project.description}</p>
      {showContextMenu && (
        <div
          className="context-menu"
          style={{
            position: "fixed",
            top: "100px",
            left: "100px",
            zIndex: 1000,
            backgroundColor: "white",
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "4px",
          }}
        >
          <button onClick={handleRename}>Rename</button>
          <button onClick={handleAddChapter}>Add Chapter</button>
          <button onClick={(e) => handleDeleteProject(e, project.id)}>Delete Project</button>
        </div>
      )}
    </div>
  );
}