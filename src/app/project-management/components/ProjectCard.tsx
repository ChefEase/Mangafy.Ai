import React, { useState } from "react";

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

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleAddChapter = (e: React.MouseEvent) => {
    e.stopPropagation();
    const chapterTitle = prompt("Enter the chapter title:");
    if (chapterTitle) {
      onCreateChapter(project.id, chapterTitle);
    }
    setShowContextMenu(false);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newTitle = prompt("Enter the new project title:", project.title);
    if (newTitle) {
      onRenameProject(project.id, newTitle);
    }
    setShowContextMenu(false);
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    const confirmDelete = window.confirm("Are you sure you want to delete this project?");
    if (confirmDelete) {
      onDeleteProject(projectId);
    }
  };

  return (
    <div className="project-card" onClick={() => onSelect(project)} onContextMenu={handleRightClick}>
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