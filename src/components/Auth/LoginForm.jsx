"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../utils/api";
import  supabase  from "@/utils/supabaseClient";
import "./styles/LoginForm.css";
import { useUser } from "@/context/UserContext";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { setUser } = useUser();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await initializeUserCredits(user.id, user.email);
        setUser({
          id: user.id,
          email: user.email,
          username: user.user_metadata?.full_name || user.email,
          avatar: user.user_metadata?.avatar_url || "/default-avatar.svg"
        });
        router.push("/project-management");
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  // Updated initializeUserCredits function
  const initializeUserCredits = async (userId, email) => {
    try {
      console.log("🚀 Starting credit initialization for:", email || "unknown");
  
      // 1. Check if already initialized
      const { data: existingUser, error: userError } = await supabase
        .from("users")
        .select("credits_initialized")
        .eq("id", userId)
        .single();
  
      if (userError && userError.code === "406") {
        console.warn("Supabase header issue, retrying with custom headers");
        return await initializeWithCustomHeaders(userId, email);
      }
  
      if (existingUser?.credits_initialized) {
        console.log("✅ User already initialized");
        return;
      }
  
      // 2. Generate fingerprint
      const fingerprint = generateDeviceFingerprint();
      console.log("🔑 Device fingerprint:", fingerprint);
  
      // 3. Check if device is already claimed
      const { data: deviceClaim, error: claimError } = await supabase
        .from("device_claims")
        .select("id")
        .eq("fingerprint", fingerprint)
        .maybeSingle();
  
      if (claimError) {
        console.error("Device claim check error:", claimError);
      }
  
      // 4. Decide how many credits to give
      let initialCredits = 0;
  
      if (!deviceClaim) {
        const userCount = await getUserCount();
        const isFirst1015 = userCount < 1015;
        initialCredits = isFirst1015 ? 375 : 295;
  
        console.log(`👥 User count: ${userCount}, Credits: ${initialCredits}`);
  
        // 5. Record this device
        await supabase.from("device_claims").insert({
          fingerprint,
          user_id: userId
        });
      } else {
        console.log("📱 Device already claimed — giving 0 credits.");
      }
  
      // 6. Save user with correct credit value
      await supabase.from("users").upsert({
        id: userId,
        email,
        credits: initialCredits,
        credits_initialized: true
      });
  
      // 7. Cache in localStorage
      localStorage.setItem(`user-${userId}-credits`, initialCredits.toString());
  
    } catch (error) {
      console.error("❌ Credit initialization error:", error);
  
      await supabase.from("users").upsert({
        id: userId,
        email,
        credits: 0, // fallback to zero
        credits_initialized: true
      });
    }
  };
  
// Helper functions
const generateDeviceFingerprint = () => {
  const data = [
    navigator.userAgent,
    navigator.hardwareConcurrency,
    navigator.deviceMemory,
    `${screen.width}x${screen.height}`,
    new Date().getTimezoneOffset()
  ].join('|');
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
};

const updateUserCredits = async (userId, email, credits) => {
  await supabase.from("users").upsert({
    id: userId,
    email: email || "unknown@example.com",
    credits: isFirst1015 ? 375 : 295,
    credits_initialized: true
  });
  
  // Cache in localStorage
  localStorage.setItem(`user-${userId}-credits`, credits.toString());
};

const getUserCount = async () => {
  try {
    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });
    return count || 0;
  } catch {
    return 0;
  }
};

const initializeWithCustomHeaders = async (userId, email) => {
  try {
    console.log("🔄 Retrying with custom headers");
    
    // Manually fetch with headers
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=credits_initialized`,
      {
        headers: {
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    if (!response.ok) throw new Error("Custom header request failed");
    
    const [data] = await response.json();
    if (data?.credits_initialized) return;
    
    // Continue initialization
    const fingerprint = generateDeviceFingerprint();
    // ... rest of initialization logic
  } catch (error) {
    console.error("Custom header fallback failed:", error);
    await updateUserCredits(userId, email, 10);
  }
};  
  
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      await initializeUserCredits(
        data.user.id, 
        data.user.email || email // Fallback to form email
      );
      setUser({
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.full_name || data.user.email,
        avatar: data.user.user_metadata?.avatar_url || "/default-avatar.svg"
      });

      router.push("/project-management");
      
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="login-form">
      <h2 style={{ textAlign: "center", fontSize: "32px", textDecoration: "underline" }}>
        Login
      </h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading} // Disable input while loading
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading} // Disable input while loading
      />
      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </div>
  );
};  