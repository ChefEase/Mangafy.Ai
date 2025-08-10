"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head"; // import Head here
import  supabase  from "@/utils/supabaseClient";
import { RegisterForm } from "@/components/Auth/RegisterForm";
import { LoginForm } from "@/components/Auth/LoginForm";
import { ResetPasswordForm } from "@/components/Auth/ResetPasswordForm";
import { GoogleLoginButton } from "@/components/Auth/GoogleLoginButton";
import { Navbar } from "@/components/Navbar/Navbar";
import { resetPassword } from "@/utils/api";

export default function AuthPage() {
  const router = useRouter();
  const [activeForm, setActiveForm] = useState<"register" | "login" | "reset-password" | "google-login">("register");
  const [referrerId, setReferrerId] = useState<string | null>(null);

  useEffect(() => {
    console.log("AuthPage loaded on", navigator.userAgent);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user && user.email_confirmed_at) {
        router.push("/Entire-Home-Auth-Page");
      }      
    };

    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferrerId(ref);
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("referrerId", ref);
        }
      } catch (e) {
        console.error("localStorage error on iOS:", e);
      }
    }
    
    checkSession();
  }, [router]);

  return (
    <div className="home">
       <Head>
        <title>Mangafy.Ai – Login or Register</title>
        <meta
          name="description"
          content="Log in or register to Mangafy.Ai to create amazing manga panels, characters, and stories with AI-powered tools."
        />

        {/* Open Graph for Social Sharing */}
        <meta property="og:title" content="Mangafy.Ai – Login or Register" />
        <meta
          property="og:description"
          content="Join Mangafy.Ai and unlock AI tools for manga creation. Login or create your account now!"
        />
        <meta property="og:url" content="https://mangafy-ai.vercel.app/login" />
        <meta
          property="og:image"
          content="https://mangafy-ai.vercel.app/logo.png"
        />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mangafy.Ai – Login or Register" />
        <meta
          name="twitter:description"
          content="Join Mangafy.Ai and unlock AI tools for manga creation. Login or create your account now!"
        />
        <meta
          name="twitter:image"
          content="https://mangafy-ai.vercel.app/logo.png"
        />
      </Head>
      <Navbar setActiveForm={setActiveForm} />
      <div className="form-container">
        {activeForm === "register" && <RegisterForm referrerId={referrerId}/>}
        {activeForm === "login" && <LoginForm />}
        {activeForm === "reset-password" && <ResetPasswordForm />}
        {activeForm === "google-login" && <GoogleLoginButton />} 
      </div> 
    </div>
  );
}
