"use client";
import "../styles/projectManagement.css";
import { useState } from "react";

interface Chapter {
  id: string;
  title: string;
}

interface ChapterListProps {
  chapters?: Chapter[]; // Make optional with ?
  onEditChapter: (chapterId: string) => void;
  onDeleteChapter: (chapterId: string) => void;
}

export default function ChapterList({ 
  chapters = [], // Provide default empty array
  onEditChapter, 
  onDeleteChapter 
}: ChapterListProps) {
  const [newChapterTitle, setNewChapterTitle] = useState("");

  const handleAddChapter = () => {
    if (newChapterTitle.trim()) {
      const newChapter: Chapter = { 
        id: crypto.randomUUID(), 
        title: newChapterTitle 
      };
      // Update to immutable update
      const updatedChapters = [...chapters, newChapter];
      setNewChapterTitle("");
    }
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (window.confirm("Are you sure you want to delete this chapter?")) {
      onDeleteChapter(chapterId);
    }
  };

  return (
    <div className="chapter-list">
      <h3>Chapters</h3>
      <ul className="chapter-list-container">
  {chapters?.map((chapter) => (
    <li key={chapter.id} className="chapter-list-item">
      <div className="chapter-info">
        <span className="chapter-title">📖 {chapter.title}</span>
      </div>
      <div className="chapter-actions">
        <button
          className="chapter-edit"
          onClick={() => onEditChapter(chapter.id)}
          title="Edit chapter"
        >
          Edit Chapter✏️
        </button>
        <button
          className="chapter-delete"
          onClick={() => handleDeleteChapter(chapter.id)}
          title="Delete chapter"
        >
          Delete Chapter🗑️
        </button>
      </div>
    </li>
  ))}
</ul>

    </div>
  );
}