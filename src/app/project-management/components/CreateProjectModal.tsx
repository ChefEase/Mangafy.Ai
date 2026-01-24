// src/app/project-management/components/CreateProjectModal.tsx
import { useState } from "react";

interface CreateProjectModalProps {
  onCreate: (projectData: { title: string; description: string; thumbnail: string }) => void;
  onClose: () => void;
}

export default function CreateProjectModal({ onCreate, onClose }: CreateProjectModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");

  const handleCreate = () => {
    if (!title.trim() || !thumbnail) {
      alert("Please fill in all fields and upload a thumbnail.");
      return;
    }
  
    onCreate({ title, description, thumbnail });
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => { 
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "character_images"); // Ensure this is correct
    formData.append("cloud_name", "ducgd9u2b"); // Ensure this is correct
  
    try {
      const response = await fetch (
        `https://api.cloudinary.com/v1_1/ducgd9u2b/image/upload`, 
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Cloudinary upload failed: ${data.error?.message || response.statusText}`);
      }

      return data.secure_url; // Return the URL of the uploaded image
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      throw error;
    }
};
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setThumbnail(imageUrl);
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image. Please try again.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">Create Project</h2>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="modal-input"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="modal-textarea"
        />
        <label className="modal-file-label">
          Project Cover Image
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="modal-file-input"
          />
        </label>
        <div className="modal-actions">
          <button onClick={handleCreate} className="modal-button primary">
            Create
          </button>
          <button onClick={onClose} className="modal-button secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
