"use client";
import { useUser } from "@/context/UserContext";
import supabase from "@/utils/supabaseClient";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import "./templates/styles/Header.css";
import { useCredits } from "@/context/CreditContext";

const Header = () => {
  const { user } = useUser();
  const { credits, refreshCredits } = useCredits();
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchCredits = async () => {
      try {
        setLoading(true);
        await refreshCredits();
      } catch (error) {
        console.error("Error fetching credits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();

    const handleCreditsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId: string; credits: number }>;
      if (customEvent.detail.userId === user?.id) {
        refreshCredits();
      }
    };

    window.addEventListener("creditsUpdated", handleCreditsUpdated);
    return () => {
      window.removeEventListener("creditsUpdated", handleCreditsUpdated);
    };
  }, [user, refreshCredits]);

  // 🔹 Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNavOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="header custom-header">
      {/* Left: Logo + dropdown */}
      <div
        className="logo-area"
        onClick={() => setNavOpen(!navOpen)}
        ref={dropdownRef}
      >
        <h1>Mangafy.ai</h1>
        <span className={`caret-icon ${navOpen ? "open" : ""}`}>⌄</span>

        {/* Dropdown */}
        <div className={`nav-dropdown ${navOpen ? "open" : ""}`}>
          <Link href="/script-writing">Script Box</Link>
          <Link href="/script-writing/templates">Script Templates</Link>
        </div>
      </div>

      {/* Right: Credits + Profile */}
      <div className="user-credit-container">
        <div className="credit-pill">
          <img src="/credit-icon.png" alt="Credits" className="credit-icon" />
          <span>{credits}</span>
        </div>

        {/* Profile */}
        <div className="user-profile">
          <span>{user?.username || "User Name"}</span>
          <img
            src={user?.avatar || "/default-avatar.svg"}
            alt="User Avatar"
            onClick={() => (window.location.href = "/profile")}
            className="profile-avatar"
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
