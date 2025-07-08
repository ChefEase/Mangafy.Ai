"use client";

import { useRouter } from "next/navigation";
import  supabase  from "@/utils/supabaseClient";
import React, {useState, useEffect} from "react";
import "./styles/GoogleLoginButton.css";
import { useUser } from "@/context/UserContext";



export const GoogleLoginButton = () => {
  const router = useRouter();
  const { setUser } = useUser();
  const [referrerId, setReferrerId] = useState(null);

  useEffect(() => {
    // This code runs only in the browser
    const searchParams = new URLSearchParams(window.location.search);
    const ref = searchParams.get("ref") || localStorage.getItem("referrerId") || null;
    if (ref) {
      localStorage.setItem("referrerId", ref);
    }
    setReferrerId(ref);
  }, []);

  if (referrerId) {
    localStorage.setItem("referrerId", referrerId);
  }

  const initializeUserCredits = async (userId, email, referrerId) => {
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
      
const referredBy = existingUser?.referred_by || referrerId || null;

      await supabase.from("users").upsert({
        id: userId,
        email,
        credits: initialCredits,
        credits_initialized: true,
        referred_by: referredBy,
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
      credits,
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
    
    
  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await initializeUserCredits(session.user.id, session.user.email || "", referrerId);
          
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            username: session.user.user_metadata?.name || session.user.email,
            avatar: session.user.user_metadata?.avatar_url || "/default-avatar.svg"
          });

          router.push("/project-management");
          subscription.unsubscribe();
        }
      });
    } catch (error) {  // Removed TypeScript type annotation
      window.dispatchEvent(
        new CustomEvent("notification", {
          detail: {
            message: error.message || "Google login failed",
            type: "error",
          },
        })
      );
    }
  };

  return (
    <div className="google-login-button">
      <button onClick={handleGoogleLogin}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          className="google-icon"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>
    </div>
  );
};