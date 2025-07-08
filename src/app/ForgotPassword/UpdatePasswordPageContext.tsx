// app/ForgotPassword/UpdatePasswordPageContent.tsx
'use client';

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import supabase from "../../utils/supabaseClient";
import "../../components/Auth/styles/UpdatePasswordForm.css";

export default function UpdatePasswordPageContent() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams?.get("token");
    const email = searchParams?.get("email");
    if (token && email) {
      recoverSession(token, email);
    } else {
      setMessage("Reset link is missing necessary information.");
    }
  }, [searchParams]);

  const recoverSession = async (token: string, email: string) => {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token,
      email,
    });

    if (error) {
      setMessage("Invalid or expired reset link.");
      console.error("Error recovering session:", error);
    } else {
      setMessage("You can now update your password.");
    }

    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage("Error updating password.");
      console.error("Update error:", error);
    } else {
      alert("Password updated successfully!");
      router.push("/Entire-Home-Auth-Page");
      window.dispatchEvent(
        new CustomEvent("notification", {
          detail: { message: "Password updated successfully!" },
        })
      );
    }
  };

  return (
    <div className="update-password-form">
      <h2 style={{ textAlign: "center", fontSize: "2rem", textDecoration: "underline" }}>
        Update Password
      </h2>
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button onClick={handleUpdatePassword} disabled={loading}>
        {loading ? "Loading..." : "Update Password"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
