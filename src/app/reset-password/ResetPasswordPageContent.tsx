// app/reset-password/ResetPasswordPageContent.tsx
'use client';

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import supabase from "../../utils/supabaseClient";
import "../../components/Auth/styles/ResetPasswordForm.css";

export default function ResetPasswordPageContent() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const handleResetPassword = async () => {
    if (!token) {
      setMessage("Invalid or missing reset token");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage("Error updating password. Please try again.");
      console.error("Update error:", error);
      return;
    }

    setMessage("Password updated successfully!");
  };

  return (
    <div className="reset-password-form">
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button onClick={handleResetPassword}>Update Password</button>
      {message && <p>{message}</p>}
    </div>
  );
}
