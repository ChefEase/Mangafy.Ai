"use client";

import React, { useState, FormEvent } from "react";
import "./styles/CharacterForm.css";

interface Character {
  name: string;
  description: string;
  role: string;
  image?: string;
}

interface CharacterFormProps {
  initialData?: Partial<Character>;
  onSubmit: (character: Omit<Character, "id">) => void;
}

export default function CharacterForm({ initialData = {}, onSubmit }: CharacterFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [role, setRole] = useState(initialData?.role || "protagonist");
  const [preview, setPreview] = useState(initialData?.image || "");
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        setPreview(URL.createObjectURL(file));
        
        // Optional: Remove AI description generation if causing issues
        // const description = await aiService.generateImageDescription(file);
        // setDescription(description);
      } catch (error) {
        console.error("Error handling image upload:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "character_images");
    formData.append("cloud_name", "ducgd9u2b");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/ducgd9u2b/image/upload`,
      { method: "POST", body: formData }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let imageUrl = initialData?.image || "";

      // Get the file from the input if a new one was selected
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = fileInput?.files?.[0];

      if (file) {
        imageUrl = await uploadImageToCloudinary(file);
      }

      await onSubmit({ name, description, role, image: imageUrl });
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="character-form">
      {/* Form fields remain the same */}
      <div className="form-group">
        <label>Character Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="protagonist">Protagonist</option>
          <option value="antagonist">Antagonist</option>
          <option value="supporting">Supporting</option>
        </select>
      </div>
      <div className="form-group">
        <label>Character Image</label>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {preview && <img src={preview} alt="Preview" className="preview-image" />}
      </div>
      <button type="submit" disabled={isUploading}>
        {isUploading ? "Processing..." : initialData?.name ? "Update" : "Create"}
      </button>
    </form>
  );
}