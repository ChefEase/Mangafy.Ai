"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/utils/supabaseClient";
import "./styles/RegisterForm.css";
import PropTypes from "prop-types";

export const RegisterForm = ({ referrerId }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    try {
      // 1. Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      const newUserId = authData.user?.id;
      if (!newUserId) throw new Error("User registration failed.");

      // 2. Insert the user into the users table
      const { error: insertError } = await supabase.from("users").insert({
        id: newUserId,
        email: email,
        referred_by: referrerId || null,
      });

      if (insertError) throw insertError;

      // 3. Award referrer credits if applicable
      if (referrerId) {
        await supabase.rpc("award_referrer_credits", {
          p_referrer_id: referrerId,
          p_credits: 150,
        });
      }

      alert("Check your email for the confirmation link!");

      // 4. Success notification and redirect
      window.dispatchEvent(
        new CustomEvent("notification", {
          detail: { message: "Registration successful!" },
        })
      );

      router.push("/project-management"); // Redirect after registration
    } catch (error) {
      console.error(error);
      alert(error.message || "Registration failed.");
    }
  };

  return (
    <div className="register-form">
      <h2>Register</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleRegister}>Register</button>
    </div>
  );
};

// ✅ PropTypes definition
RegisterForm.propTypes = {
  referrerId: PropTypes.string,
};
