"use client";
import { useUser } from "@/context/UserContext";
import  supabase  from "@/utils/supabaseClient";
import { useEffect, useState } from "react";
import Link from "next/link";
import "./templates/styles/Header.css";
import { useCredits } from "@/context/CreditContext";

const Header = () => {
  const { user } = useUser();
  const { credits, refreshCredits } = useCredits(); // Added refreshCredits
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
    <div className="header">
      <h1>Manga Script Writer</h1>
      <nav>
        <Link href="/script-writing">Script Box</Link>
        <Link href="/script-writing/templates">Script Templates</Link>
        <Link href="/script-writing/ai-generate">AI Generate</Link>
        <Link href="/script-writing/generate-character">Generate Character</Link>
        <Link href="/script-writing/generate-cover">Generate Cover</Link>
        <Link href="/chat">Ai ChatBot</Link>
      </nav>
      <div className="user-credit-container">
        <div className="credit-pill">
          <img src="/credit-icon.png" alt="Credits" className="credit-icon" />
          <span>{credits}</span>
        </div>
        </div>
    </div>
  );
};

export default Header;