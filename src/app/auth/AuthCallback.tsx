// app/auth/AuthCallback.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/utils/supabaseClient";
import "./callback/global.css";
import { useUser } from "@/context/UserContext";

export default function AuthCallback() {
  const router = useRouter();
  const { setUser } = useUser();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (!session || error) {
        router.push("/login?error=authentication_failed");
        return;
      }

      const userId = session.user.id;
      const userEmail = session.user.email;

      // Ensure searchParams is not null before calling get("ref")
      let referrerId = localStorage.getItem("referrerId");
      if (!referrerId && searchParams) {
        referrerId = searchParams.get("ref");
      }

      console.log("AuthCallback: userId:", userId, "userEmail:", userEmail, "referrerId:", referrerId);

      await supabase.from("users").upsert({
        id: userId,
        email: userEmail,
        credits: 0,
        credits_initialized: false,
      });

      if (referrerId) {
        await supabase.rpc("award_referrer_credits", {
          p_referrer_id: referrerId,
          p_credits: 125,
        });
        localStorage.removeItem("referrerId");
      }

      router.push("/project-management");
    };

    handleAuth();
  }, [router, searchParams]);

  return <div className="loading-screen">Authenticating...</div>;
}
