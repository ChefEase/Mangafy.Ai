"use client";

import React, { useState } from "react";
import { resetPassword } from "../../utils/api";
import "./styles/ResetPasswordForm.css";

export const ResetPasswordForm = () => {
  const [email, setEmail] = useState("");

  const handleResetPassword = async () => {
    try {
      const data = await resetPassword(email);
      alert("Password reset email sent!");
    } catch (error) {
      alert(error.message);
    }
    
    window.dispatchEvent(
      new CustomEvent('notification', {
        detail: { message: 'Password reset email sent!' },
      })
    );
  };

  return (
    <div className="reset-password-form">
      <h2>Reset Password</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleResetPassword}>Reset Password</button>
    </div>
  );
};