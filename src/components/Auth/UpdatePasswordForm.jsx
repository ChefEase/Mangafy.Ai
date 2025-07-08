"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "../../utils/api";
import "./styles/UpdatePasswordForm.css"; 

export const UpdatePasswordForm = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleUpdatePassword = async () => {
    try {
      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }

      await updatePassword(password);

      setMessage("Password updated successfully! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000); // Redirect after success
    } catch (error) {
      console.error("Error updating password:", error);
      setMessage(error.message);
    }
  };

  return (
    <div className="update-password-form">
      <h2>Reset Your Password</h2>
      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button onClick={handleUpdatePassword}>Update Password</button>
      {message && <p>{message}</p>}
    </div>
  );
};
