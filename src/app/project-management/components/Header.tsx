"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import  supabase  from "@/utils/supabaseClient";
import "../styles/Credit.css";
import { useCredits } from "@/context/CreditContext";

export default function Header() {
  const { user } = useUser();
  const { credits, refreshCredits } = useCredits();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchCredits = async () => {
      try {
        setLoading(true);
        await refreshCredits(); // Use refreshCredits from context
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
        refreshCredits(); // Refresh credits on update event
      }
    };

    window.addEventListener('creditsUpdated', handleCreditsUpdated);
    return () => {
      window.removeEventListener('creditsUpdated', handleCreditsUpdated);
    };
  }, [user]);

  return (
    <header className="header">
      <nav className="nav">
        <Link href="/project-management">Projects Tab</Link>
      </nav>
      
      <div className="user-credit-container">
        <div className="credit-pill">
          <img src="/credit-icon.png" alt="Credits" className="credit-icon" />
          <span>{credits}</span>
        </div>
        
        <div className="user-profile">
          <span>{user?.username || "User Name"}</span>
          <img 
            src={user?.avatar || "/default-avatar.svg"} 
            alt="User Avatar" 
            onClick={() => window.location.href = "/profile"} 
            className="profile-avatar"
          />
        </div>
      </div>
    </header>
  );
}