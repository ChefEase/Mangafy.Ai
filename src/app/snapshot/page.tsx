"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./snapshot.css";

interface Snapshot {
  id: string;
  name: string;
  image: string;
  prompt: string;
  stylePreset: string;
  artStyle: string;
  panelLayout: string;
  colorOption: string;
  moodPreset: string;
  mangafyChecked: boolean;
  customArtStyle?: string | null;
  guidanceScale: number;
  seed: number;
}

const SnapshotPage: React.FC = () => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const router = useRouter();

  // Load saved snapshots
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("snapshots") || "[]");
    setSnapshots(saved);
  }, []);

  // Save snapshots back to storage whenever updated
  const saveToStorage = (newSnaps: Snapshot[]) => {
    setSnapshots(newSnaps);
    localStorage.setItem("snapshots", JSON.stringify(newSnaps));
  };

  // 🟠 Revert and tweak function
  const handleRevert = (snap: Snapshot) => {
    // Save snapshot data to localStorage so ScriptWritingClient can restore it
    localStorage.setItem("revertSnapshot", JSON.stringify(snap));

    // Redirect to your main editor page
    router.push("/script-writing?restore=true"); // add flag so main page knows to restore
  };

  // 🗑️ Delete snapshot
  const handleDelete = (id: string) => {
    const confirmDelete = window.confirm("Delete this snapshot?");
    if (!confirmDelete) return;

    const updated = snapshots.filter((snap) => snap.id !== id);
    saveToStorage(updated);
  };

  return (
    <div className="snapshotPage">
      <h1 className="snapshotTitle">My Snapshots</h1>

      {snapshots.length === 0 && (
        <div className="emptySnapshotState">
          <img
            src="/screenshots/snapshot.png"
            alt="No snapshots"
            className="emptyImage"
          />
          <p>No snapshots</p>
        </div>
      )}

      {snapshots.map((snap) => (
        <div className="snapshotCard" key={snap.id}>
          <img src={snap.image} alt={snap.name} className="snapshotPreview" />

          <div className="snapshotInfo">
            <h3>{snap.name}</h3>
            <ul>
              <li><strong>Prompt:</strong> {snap.prompt}</li>
              <li><strong>Style Preset:</strong> {snap.stylePreset}</li>
              <li><strong>Art Style:</strong> {snap.artStyle}</li>
              <li><strong>Panel Layout:</strong> {snap.panelLayout}</li>
              <li><strong>Color Option:</strong> {snap.colorOption}</li>
              <li><strong>Mood/Lighting:</strong> {snap.moodPreset}</li>
              <li><strong>Mangafy:</strong> {snap.mangafyChecked ? "True" : "False"}</li>
              <li><strong>Custom Art Style:</strong> {snap.customArtStyle || "False"}</li>
              <li><strong>Guidance Scale:</strong> {snap.guidanceScale}</li>
              <li><strong>Seed:</strong> {snap.seed}</li>
            </ul>

            <div className="snapshotActions">
              <button className="revertBtn" onClick={() => handleRevert(snap)}>
                Revert & Tweak
              </button>
              <button className="deleteBtn" onClick={() => handleDelete(snap.id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SnapshotPage;
