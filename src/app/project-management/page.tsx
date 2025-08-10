"use client";

import { useState, useEffect } from "react";
import Header from "./components/Header";
import ProjectSidebar from "./components/ProjectSidebar";
import ProjectCard from "./components/ProjectCard";
import CreateProjectModal from "./components/CreateProjectModal";
import ChapterList from "./components/ChapterList";
import "./styles/projectManagement.css";
import { fetchUserData, saveUserData } from "@/utils/airtable";
import Head from "next/head";

// ✅ Define TypeScript interfaces for Projects & Chapters
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      fetchUserData(userId).then((data) => {
        setProjects(data.projects || []);
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  // ✅ Fixing `handleCreateProject`
  const handleCreateProject = async (projectData: { title: string; description: string; thumbnail: string }) => {
    const userId = localStorage.getItem("userId");
    console.log(localStorage.getItem("userId"));

    if (!userId) {
      console.error("❌ No userId found in localStorage");
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

    console.log("✅ Saving project to Airtable...");

    try {// Save updated projects to Airtable
      await saveUserData(userId, { projects: updatedProjects, characters: {} });
      console.log("✅ Project saved to Airtable");

      window.dispatchEvent(new CustomEvent("projectCreated"));

    } catch (error) {
      console.error("❌ Error saving project to Airtable:", error);
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

    // Save updated projects to Airtable
    const userId = localStorage.getItem("userId");
    if (userId) {
      saveUserData(userId, { projects: updatedProjects, characters: {} });
    }
  };

  const handleCreateChapter = async (projectId: string, chapterTitle: string) => {
    const updatedProjects = projects.map((project) => {
      if (project.id === projectId) {
        const newChapter = {
          id: crypto.randomUUID(),
          title: chapterTitle, // Use the provided chapter title
        };
        return {
          ...project,
          chapters: [...project.chapters, newChapter],
        };
      }
      return project;
    });
    setProjects(updatedProjects);

    // Save updated projects to Airtable
    const userId = localStorage.getItem("userId");
    if (userId) {
      await saveUserData(userId, { projects: updatedProjects, characters: {} });
    }
  };

  const handleEditChapter = (chapterId: string) => {
    // Redirect to the script-writing page
    window.location.href = `/script-writing?chapterId=${chapterId}`;
  };

  const handleDeleteChapter = async (chapterId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this chapter?");
    if (confirmDelete) {
      const updatedProjects = projects.map((project) => {
        if (project.id === selectedProject?.id) {
          return {
            ...project,
            chapters: project.chapters.filter((chapter) => chapter.id !== chapterId),
          };
        }
        return project;
      });
      setProjects(updatedProjects);

      // Save updated projects to Airtable
      const userId = localStorage.getItem("userId");
      if (userId) {
        await saveUserData(userId, { projects: updatedProjects, characters: {} });
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this project?");
    if (confirmDelete) {
      const updatedProjects = projects.filter((project) => project.id !== projectId);
      setProjects(updatedProjects);

      // Save updated projects to Airtable
      const userId = localStorage.getItem("userId");
      if (userId) {
        await saveUserData(userId, { projects: updatedProjects, characters: {} });
      }
    }
  };

  return (
    <div>
        <Head>
  <title>Project Management – Mangafy.Ai</title>
  <meta
    name="description"
    content="Manage your manga projects effortlessly on Mangafy.Ai. Create, organize, and track your manga stories and chapters with ease."
  />
  {/* Open Graph */}
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://mangafy-ai.vercel.app/project-management" />
  <meta property="og:title" content="Project Management – Mangafy.Ai" />
  <meta
    property="og:description"
    content="Manage your manga projects effortlessly on Mangafy.Ai. Create, organize, and track your manga stories and chapters with ease."
  />
  <meta property="og:image" content="https://mangafy-ai.vercel.app/logo.png" />

  {/* Twitter */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://mangafy-ai.vercel.app/project-management" />
  <meta name="twitter:title" content="Project Management – Mangafy.Ai" />
  <meta
    name="twitter:description"
    content="Manage your manga projects effortlessly on Mangafy.Ai. Create, organize, and track your manga stories and chapters with ease."
  />
  <meta name="twitter:image" content="https://mangafy-ai.vercel.app/logo.png" />
</Head>

      <Header />
      <div className="project-management-page">
        <ProjectSidebar
          projects={projects}
          onSelectProject={(project) => setSelectedProject(project)} // ✅ Now passing full project object
          onCreateProject={() => setShowCreateModal(true)}
        />

        <div className="main-content">
          {selectedProject ? (
            <>
              <button onClick={() => setSelectedProject(null)} className="button back-button">
                Back to Projects
              </button>
              <h2>{selectedProject.title}</h2>
              <ChapterList
                chapters={selectedProject.chapters}
                onEditChapter={handleEditChapter}
                onDeleteChapter={handleDeleteChapter}
              />
            </>
          ) : (
            <div className="project-grid">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onSelect={(p) => setSelectedProject(p)}
                  onDeleteProject={handleDeleteProject}
                  onCreateChapter={handleCreateChapter} // Pass the function here
                  onRenameProject={handleRenameProject} // Pass the function here
                />
              ))}
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