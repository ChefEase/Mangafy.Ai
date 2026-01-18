import React, { useState, useRef, useEffect } from "react";


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
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleAddChapter = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const chapterTitle = prompt("Enter the chapter title:");
    if (chapterTitle) {
      onCreateChapter(project.id, chapterTitle);
    }
    setShowActions(false);
  };

  const handleRename = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const newTitle = prompt("Enter the new project title:", project.title);
    if (newTitle) {
      onRenameProject(project.id, newTitle);
    }
    setShowActions(false);
  };

  const handleDeleteProject = (e: React.MouseEvent | React.TouchEvent, projectId: string) => {
    e.stopPropagation();
    const confirmDelete = window.confirm("Are you sure you want to delete this project?");
    if (confirmDelete) {
      onDeleteProject(projectId);
    }
    setShowActions(false);
  };

  const handleOpenProject = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onSelect(project);
    setShowActions(false);
  };

  // Close actions when clicking/tapping outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        cardRef.current &&
        !cardRef.current.contains(e.target as Node)
      ) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showActions]);

  return (
    <div
      ref={cardRef}
      className={`project-card${showActions ? " is-open" : ""}`}
      onClick={() => setShowActions((prev) => !prev)}
      role="button"
      tabIndex={0}
      aria-expanded={showActions}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setShowActions((prev) => !prev);
        }
      }}
    >
      <img src={project.thumbnail} alt={project.title} />
      <h3>{project.title}</h3>
      <p>{project.description}</p>
      {showActions && (
        <div className="project-card-actions" onClick={(e) => e.stopPropagation()}>
          <button className="project-card-action primary" onClick={handleOpenProject}>
            Open Project
          </button>
          <button className="project-card-action" onClick={handleAddChapter}>
            Add Chapter
          </button>
          <button className="project-card-action" onClick={handleRename}>
            Rename
          </button>
          <button
            className="project-card-action danger"
            onClick={(e) => handleDeleteProject(e, project.id)}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
