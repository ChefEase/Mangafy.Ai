"use client";

import React, { useEffect } from "react";
import ProfileForm from "../../components/Profile/ProfileForm";
import SubscriptionStatus from "../../components/Profile/SubscriptionStatus";
import {LogoutButton} from "../../components/Profile/LogOutButton"; // ✅ You imported this correctly
import UsageTracker from "../../components/Profile/UsageTracker";
import "../../components/Profile/styles/ProfileForm.css";

export default function ProfilePage() {
  useEffect(() => {
    console.log("🔄 Refreshing Usage Tracker...");
    window.dispatchEvent(new CustomEvent("projectCreated"));
  }, []);

  return (
    <div className="profile-page">
      <h1>Your Profile</h1>

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
        <LogoutButton /> {/* ✅ Correctly render the reusable logout button */}
      </div>
    </div>
  );
}
