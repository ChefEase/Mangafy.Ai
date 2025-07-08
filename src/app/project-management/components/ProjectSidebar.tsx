"use client";
import "../styles/projectManagement.css";
import { useState } from "react";

// Define types for the project object
interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  chapters: { id: string; title: string }[];
}

// Define the props for ProjectSidebar
interface ProjectSidebarProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
}

export default function ProjectSidebar({ projects, onSelectProject, onCreateProject }: ProjectSidebarProps) {
  const [isProjectsCollapsed, setIsProjectsCollapsed] = useState(false);
  const handleShare = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    // Implement share functionality
  };

  return (
    <div className="project-sidebar">
      <div className="sidebar-section">
        <h3 onClick={() => setIsProjectsCollapsed(!isProjectsCollapsed)}>
          Projects {isProjectsCollapsed ? "▶" : "▼"}
        </h3>
        {!isProjectsCollapsed && (
          <ul className="project-list">
          {projects.map((project) => (
            <li
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="project-list-item"
              title={project.title}
            >
              <span className="project-icon">📁</span>
              <span className="project-title">{project.title}</span>
            </li>
          ))}
        </ul>        
        )}
        <button className="button add-project-button" onClick={onCreateProject}>
          Add Project
        </button>
      </div>
    </div>
  );
}
