"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "./UserContext";
import  supabase  from "@/utils/supabaseClient";

interface CreditContextType {
  credits: number;
  deductCredits: (amount: number) => Promise<boolean>;
  refreshCredits: () => Promise<void>;
  addCredits: (amount: number) => Promise<void>;
}

const CreditContext = createContext<CreditContextType | null>(null);

export const CreditProvider = ({ children }: { children: React.ReactNode }) => {
  const [credits, setCredits] = useState(0);
  const { user } = useUser();

  const addCredits = async (amount: number) => {
    if (!user?.id) return;
    
    const newCredits = credits + amount;
    setCredits(newCredits);
    localStorage.setItem(`user-${user.id}-credits`, newCredits.toString());
  
    try {
      const { error } = await supabase
        .from("users")
        .update({ credits: newCredits })
        .eq("id", user.id);
      if (error) throw error;
    } catch (error) {
      // Revert on error
      setCredits(credits);
      localStorage.setItem(`user-${user.id}-credits`, credits.toString());
      console.error("Credit addition failed:", error);
    }
  };
  
  const fetchCredits = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("users")
        .select("credits")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setCredits(data?.credits || 0);
      localStorage.setItem(`user-${user.id}-credits`, data?.credits?.toString() || "0");
    } catch (error) {
      console.error("Error fetching credits:", error);
      const cached = localStorage.getItem(`user-${user.id}-credits`);
      setCredits(cached ? Number(cached) : 0);
    }
  };

  const deductCredits = async (amount: number): Promise<boolean> => {
    if (credits < amount) return false;
    if (!user?.id) return false; // Fixed: return false instead of undefined

    const newCredits = credits - amount;
    setCredits(newCredits);
    localStorage.setItem(`user-${user.id}-credits`, newCredits.toString());

    try {
      const { error } = await supabase
        .from("users")
        .update({ credits: newCredits })
        .eq("id", user.id);
        
      if (error) throw error;
      return true;
    } catch (error) {
      // Revert on error
      setCredits(credits);
      localStorage.setItem(`user-${user.id}-credits`, credits.toString());
      console.error("Credit deduction failed:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [user]);

  return (
    <CreditContext.Provider value={{ credits, deductCredits, refreshCredits: fetchCredits, addCredits }}>
      {children}
    </CreditContext.Provider>
  );
};

export const useCredits = () => {
  try {
    const context = useContext(CreditContext);
    if (!context) {
      if (typeof window === "undefined") {
        // Return harmless fallback during SSR
        return {
          credits: 0,
          deductCredits: async () => false,
          refreshCredits: async () => {},
          addCredits: async () => {}
        };
      }
      throw new Error("useCredits must be used within a CreditProvider");
    }
    return context;
  } catch {
    // Extra protection for edge cases (like _error.js prerender)
    return {
      credits: 0,
      deductCredits: async () => false,
      refreshCredits: async () => {},
      addCredits: async () => {}
    };
  }
};
