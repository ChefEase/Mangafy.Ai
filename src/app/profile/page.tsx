"use client";

import React, { useEffect, useState } from "react";
import ProfileForm from "../../components/Profile/ProfileForm";
import SubscriptionStatus from "../../components/Profile/SubscriptionStatus";
import { LogoutButton } from "../../components/Profile/LogOutButton";
import UsageTracker from "../../components/Profile/UsageTracker";
import "../../components/Profile/styles/ProfileForm.css";

export default function ProfilePage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    console.log("Refreshing Usage Tracker...");
    window.dispatchEvent(new CustomEvent("projectCreated"));
  }, []);

  useEffect(() => {
    const savedTheme =
      (typeof window !== "undefined" && localStorage.getItem("theme")) || "light";
    const nextTheme = savedTheme === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  }, []);

  const handleThemeChange = (next: "light" | "dark") => {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", next);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Your Profile</h1>
        <div className="theme-toggle" role="group" aria-label="Theme">
          <button
            type="button"
            className={`theme-button${theme === "light" ? " active" : ""}`}
            onClick={() => handleThemeChange("light")}
          >
            Light mode
          </button>
          <button
            type="button"
            className={`theme-button${theme === "dark" ? " active" : ""}`}
            onClick={() => handleThemeChange("dark")}
          >
            Dark mode
          </button>
        </div>
      </div>

      <div className="profile-section">
        <h2>Profile Information</h2>
        <ProfileForm />
      </div>

      <div className="subscription-section">
        <h2>Subscription Status</h2>
        <SubscriptionStatus />
      </div>

      <div className="usage-section">
        <h2>Usage Tracking</h2>
        <UsageTracker />
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <LogoutButton />
      </div>
    </div>
  );
}
