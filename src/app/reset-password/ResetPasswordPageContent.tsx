// app/reset-password/ResetPasswordPageContent.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import supabase from "../../utils/supabaseClient";
import "../../components/Auth/styles/ResetPasswordForm.css";

export default function ResetPasswordPageContent() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const email = searchParams?.get("email");
  const router = useRouter();

  useEffect(() => {
    if (!token || !email) {
      setMessage("Reset link is missing necessary information.");
      return;
    }

    const verifyRecovery = async () => {
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
        setSessionReady(true);
        setMessage("You can now update your password.");
      }

      setLoading(false);
    };

    void verifyRecovery();
  }, [token, email]);

  const handleResetPassword = async () => {
    if (!sessionReady) {
      setMessage("Please use the reset link again to verify your session.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setMessage("Please fill in both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
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
    setTimeout(() => router.push("/Entire-Home-Auth-Page"), 1200);
  };

  return (
    <div className="reset-password-form">
      <h2>Reset Your Password</h2>
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
      <button onClick={handleResetPassword} disabled={loading}>
        {loading ? "Loading..." : "Update Password"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
