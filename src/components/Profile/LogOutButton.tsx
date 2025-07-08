"use client";

import React from "react";
import { useRouter } from "next/navigation";
import  supabase  from "@/utils/supabaseClient";
import "./styles/LogOutButton.css";

export const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      console.warn("No active session to log out of.");
      return;
    }
  
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
    } catch (err) {
      // Fix: Ensure err is typed as Error to safely access .message
      if (err instanceof Error) {
        console.error("Logout error:", err.message);
      } else {
        console.error("Logout error:", err);
      }
      alert("Logout failed. Try again.");
    }
  };

  return (
    <button className="logout-button" onClick={handleLogout}>
      Sign Out
    </button>
  );
};
