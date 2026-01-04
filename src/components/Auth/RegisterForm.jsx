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
      // 1) Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
  
      if (authError) {
        const msg = (authError.message || "").toLowerCase();
  
        // Common Supabase "already registered" cases
        if (
          msg.includes("already registered") ||
          msg.includes("already been registered") ||
          msg.includes("user already exists") ||
          msg.includes("already exists")
        ) {
          alert("An account with this email already exists. Try logging in.");
          return;
        }
  
        throw authError;
      }
  
      const newUserId = authData.user?.id;
      if (!newUserId) throw new Error("User registration failed.");
  
      // 2) Upsert into users table (prevents duplicate/constraint spam)
      const { error: upsertError } = await supabase
        .from("users")
        .upsert(
          {
            id: newUserId,
            email,
            referred_by: referrerId || null,
          },
          { onConflict: "id" } // or "email" if email is your unique column
        );
  
      if (upsertError) {
        const dbMsg = (upsertError.message || "").toLowerCase();
        const dbCode = upsertError.code; // often "23505" for unique violation in Postgres
  
        // Friendly message for duplicates / constraint noise
        if (
          dbCode === "23505" ||
          dbMsg.includes("duplicate key") ||
          dbMsg.includes("already exists") ||
          dbMsg.includes("violates foreign key constraint")
        ) {
          alert("An account with this email already exists. Try logging in.");
          return;
        }
  
        throw upsertError;
      }
  
      // 3) Award referrer credits if applicable
      if (referrerId) {
        await supabase.rpc("award_referrer_credits", {
          p_referrer_id: referrerId,
          p_credits: 150,
        });
      }
  
      alert("Check your email for the confirmation link!");
  
      window.dispatchEvent(
        new CustomEvent("notification", {
          detail: { message: "Registration successful!" },
        })
      );
    } catch (error) {
      console.error(error);
  
      const message = (error?.message || "").toLowerCase();
      if (
        message.includes("already registered") ||
        message.includes("already been registered") ||
        message.includes("duplicate key") ||
        message.includes("already exists") ||
        message.includes("violates foreign key constraint")
      ) {
        alert("An account with this email already exists. Try logging in.");
        return;
      }
  
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
