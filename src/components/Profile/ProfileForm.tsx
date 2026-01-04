"use client";
import React, { useState, useEffect, useRef } from "react";
import  supabase  from "@/utils/supabaseClient";
import "./styles/ProfileForm.css";
import { useNotifications } from "@/hooks/useNotifications";
import { useUser } from "@/context/UserContext"; // Import the useUser hook

export default function ProfileForm() {
  const { user, setUser } = useUser(); // Destructure setUser here
  const [email, setEmail] = useState<string>(user?.email || "");
  const [username, setUsername] = useState<string>(user?.username || "");
  const [fullName, setFullName] = useState<string>(user?.fullName || "");
  const [avatar, setAvatar] = useState<string>(user?.avatar || "/default-avatar.svg");
  const [notifications, setNotifications] = useState<boolean>(true);
  const [showImagePreview, setShowImagePreview] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useNotifications(notifications);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        console.error("Session retrieval failed:", error);
        return;
      }
  
      const { user } = data.session;
      if (user) {
        setEmail(user.email || "");
        setUsername(user.user_metadata?.username || "");
        setFullName(user.user_metadata?.full_name || "");
        setAvatar(user.user_metadata?.avatar_url || "/default-avatar.svg");
        setNotifications(user.user_metadata?.notification_preference ?? true);
  
        setUser({
          id: user.id,
          email: user.email || "",
          username: user.user_metadata?.username || "",
          fullName: user.user_metadata?.full_name || "",
          avatar: user.user_metadata?.avatar_url || "/default-avatar.svg",
        });
      }
    };
  
    fetchProfile();
  }, [setUser]);
  
  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const imageUrl = event.target.result as string;
        setAvatar(imageUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          username,
          full_name: fullName,
          avatar_url: avatar,
          notification_preference: notifications,
        },
      });

      if (error) throw error;

      // Update global user state
      setUser({
        id: user?.id || "",
        email,
        username,
        fullName,
        avatar,
      });

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An error occurred while updating your profile.");
    }

    window.dispatchEvent(
      new CustomEvent('notification', {
        detail: { message: 'Profile updated successfully!' },
      })
    );
  };

  return (
    <div className="profile-container">
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="avatar-section">
          <div className="avatar-preview" onClick={() => fileInputRef.current?.click()}>
            <img src={avatar} alt="Profile" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              hidden
            />
          </div>
          <button
            type="button"
            className="preview-button"
            onClick={() => setShowImagePreview(true)}
          >
            👁️ Preview
          </button>
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="disabled-input"
          />
        </div>

        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Notifications</label>
          <input
            type="checkbox"
            checked={notifications}
            onChange={() => setNotifications(!notifications)}
          />
          <span>Enable Notifications</span>
        </div>

        <button type="submit">Save Changes</button>

        {showImagePreview && (
          <div
            className="image-preview-overlay"
            onClick={() => setShowImagePreview(false)}
          >
            <div className="image-preview-container">
              <img src={avatar} alt="Profile Preview" />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}