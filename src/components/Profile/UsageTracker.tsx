"use client";

import React, { useState, useEffect } from "react";
import  supabase  from "@/utils/supabaseClient";
import { fetchUserData } from "@/utils/airtable";
import "./styles/UsageTracker.css";

export default function UsageTracker() {
  const [projectsCreated, setProjectsCreated] = useState(0);

  const fetchUsage = async () => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      try {
        // Fetch usage data from your database
        console.log("✅ Fetching user data from Airtable...");
        const userData = await fetchUserData(userId);
        console.log("📊 Projects Retrieved:", userData.projects.length);
        setProjectsCreated(userData.projects ? userData.projects.length : 0);
      } catch (error) {
        console.error("❌ Error fetching user data from Airtable:", error);
      }
    }
  };

  useEffect(() => {
    fetchUsage();

    const handleProjectCreated = () => {
      fetchUsage();
    };

    window.addEventListener("projectCreated", handleProjectCreated);

    return () => {
      window.removeEventListener("projectCreated", handleProjectCreated);
    };
  }, []);

  return (
    <div className="usage-tracker">
      <p>Projects Created: <strong>{projectsCreated}</strong></p>
    </div>
  );
}