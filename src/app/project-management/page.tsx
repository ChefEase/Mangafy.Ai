"use client";

import { useState, useEffect } from "react";
import Header from "./components/Header";
import ProjectSidebar from "./components/ProjectSidebar";
import ProjectCard from "./components/ProjectCard";
import CreateProjectModal from "./components/CreateProjectModal";
import ChapterList from "./components/ChapterList";
import "./styles/projectManagement.css";
import { fetchUserData, saveUserData } from "@/utils/airtable";
import { useUser } from "@/context/UserContext";

// Define TypeScript interfaces for Projects & Chapters
interface Chapter {
  id: string;
  title: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  chapters: Chapter[];
}

export default function ProjectManagementPage() {
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Get userId from UserContext or fallback to localStorage
  const userId = user?.id || (typeof window !== "undefined" ? localStorage.getItem("userId") : null);

  useEffect(() => {
    // Check if user is authenticated
    if (user === null && !userId) {
      // User is not authenticated, redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return;
    }

    if (userId) {
      setIsLoading(true);
      fetchUserData(userId).then((data) => {
        setProjects(data.projects || []);
      }).catch((error) => {
        console.error("Error fetching user data:", error);
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [userId, user]);

  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (!selectedProject) return;
    const refreshedProject = projects.find((project) => project.id === selectedProject.id) || null;
    if (!refreshedProject) {
      setSelectedProject(null);
      return;
    }
    if (refreshedProject !== selectedProject) {
      setSelectedProject(refreshedProject);
    }
  }, [projects, selectedProject]);

  const handleCreateProject = async (projectData: {
    title: string;
    description: string;
    thumbnail: string;
  }) => {
    console.log("Creating project for userId:", userId);

    if (!userId) {
      console.error("No userId found");
      alert("You're not signed in properly. Please log in again.");
      return;
    }

    const newProject = {
      id: crypto.randomUUID(),
      ...projectData,
      chapters: [],
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);

    console.log("Saving project to Airtable...");

    try {
      await saveUserData(userId, { projects: updatedProjects, characters: {} });
      console.log("Project saved to Airtable");

      window.dispatchEvent(new CustomEvent("projectCreated"));
    } catch (error) {
      console.error("Error saving project to Airtable:", error);
      alert("Something went wrong saving your project.");
    }
    setShowCreateModal(false);
  };

  const handleRenameProject = (projectId: string, newTitle: string) => {
    const updatedProjects = projects.map((project) => {
      if (project.id === projectId) {
        return {
          ...project,
          title: newTitle,
        };
      }
      return project;
    });
    setProjects(updatedProjects);

    if (userId) {
      saveUserData(userId, { projects: updatedProjects, characters: {} });
    }
  };

  const handleCreateChapter = async (projectId: string, chapterTitle: string) => {
    const updatedProjects = projects.map((project) => {
      if (project.id === projectId) {
        const newChapter = {
          id: crypto.randomUUID(),
          title: chapterTitle,
        };
        return {
          ...project,
          chapters: [...project.chapters, newChapter],
        };
      }
      return project;
    });
    setProjects(updatedProjects);

    if (userId) {
      await saveUserData(userId, { projects: updatedProjects, characters: {} });
    }
  };

  const handleEditChapter = (chapterId: string) => {
    window.location.href = `/script-writing?chapterId=${chapterId}`;
  };

  const promptCreateChapter = (projectId: string) => {
    const chapterTitle = prompt("Enter the chapter title:");
    if (chapterTitle) {
      handleCreateChapter(projectId, chapterTitle);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this chapter?");
    if (confirmDelete) {
      const updatedProjects = (projects || []).map((project) => {
        if (project.id === selectedProject?.id) {
          return {
            ...project,
            chapters: (project.chapters || []).filter((chapter) => chapter.id !== chapterId),
          };
        }
        console.log("project.chapters before filter:", project.chapters);
        return project;
      });
      setProjects(updatedProjects);

      if (userId) {
        await saveUserData(userId, { projects: updatedProjects, characters: {} });
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this project?");
    if (confirmDelete) {
      console.log("projects before filter:", projects);
      const updatedProjects = (projects || []).filter((project) => project.id !== projectId);
      setProjects(updatedProjects);

      if (userId) {
        await saveUserData(userId, { projects: updatedProjects, characters: {} });
      }
    }
  };

  // Show loading state while checking authentication
  if (isLoading || user === undefined) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading your projects...
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="project-management-page">
        <ProjectSidebar
          projects={projects}
          onSelectProject={(project) => setSelectedProject(project)}
        />

        <div className="main-content">
          {selectedProject ? (
            <div className="project-detail">
              <div className="project-detail-header">
                <button onClick={() => setSelectedProject(null)} className="button back-button">
                  Back to Projects
                </button>
              </div>
              <h2>{selectedProject.title}</h2>
              {selectedProject.chapters?.length > 0 && (
                <div className="chapter-toolbar">
                  <button
                    className="button add-chapter-button"
                    onClick={() => promptCreateChapter(selectedProject.id)}
                  >
                    Add Chapter
                  </button>
                </div>
              )}
              {selectedProject.chapters?.length === 0 ? (
                <div className="empty-state">
                  <button
                    className="button add-chapter-button add-chapter-button--large"
                    onClick={() => promptCreateChapter(selectedProject.id)}
                  >
                    Add Chapter
                  </button>
                </div>
              ) : (
                <ChapterList
                  chapters={selectedProject.chapters}
                  onEditChapter={handleEditChapter}
                  onDeleteChapter={handleDeleteChapter}
                />
              )}
            </div>
          ) : (
            <div className="projects-section">
              <div className="projects-header">
                <h2>Projects</h2>
                {projects.length > 0 && (
                  <button
                    className="button add-project-button"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Add Project
                  </button>
                )}
              </div>
              {projects.length === 0 ? (
                <div className="empty-state">
                  <button
                    className="button add-project-button add-project-button--large"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Add Project
                  </button>
                  <a
                    className="empty-state-link"
                    href="/documentation-project-management"
                  >
                    New to MangafyAi? Learn how to create a project
                  </a>
                </div>
              ) : (
                <div className="project-grid">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onSelect={(p) => setSelectedProject(p)}
                      onDeleteProject={handleDeleteProject}
                      onRenameProject={handleRenameProject}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateProjectModal
          onCreate={handleCreateProject}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
