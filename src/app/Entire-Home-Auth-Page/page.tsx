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
      {/* English Meta */}
      <title>Mangafy.Ai – Login or Register</title>
      <meta
        name="description"
        content="Log in or register to Mangafy.Ai to create amazing manga panels, characters, and stories with AI-powered tools."
      />

      {/* Japanese Meta */}
      <title lang="ja">Mangafy.Ai – ログインまたは登録</title>
      <meta
        name="description"
        lang="ja"
        content="Mangafy.Aiにログインまたは登録して、AIを使った漫画のパネル、キャラクター、ストーリーを作成しましょう。"
      />

      {/* Open Graph for Social Sharing (English) */}
      <meta property="og:title" content="Mangafy.Ai – Login or Register" />
      <meta
        property="og:description"
        content="Join Mangafy.Ai and unlock AI tools for manga creation. Login or create your account now!"
      />
      <meta property="og:url" content="https://www.mangafyai.com/login" />
      <meta
        property="og:image"
        content="https://www.mangafyai.com/logo.png"
      />

      {/* Open Graph (Japanese) */}
      <meta property="og:title" content="Mangafy.Ai – ログインまたは登録" lang="ja" />
      <meta
        property="og:description"
        content="Mangafy.Aiに参加して、AI漫画作成ツールを使い始めましょう。今すぐアカウントを作成またはログイン！"
        lang="ja"
      />

      {/* Twitter Card (English) */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mangafy.Ai – Login or Register" />
      <meta
        name="twitter:description"
        content="Join Mangafy.Ai and unlock AI tools for manga creation. Login or create your account now!"
      />
      <meta
        name="twitter:image"
        content="https://www.mangafyai.com/logo.png"
      />

      {/* Twitter Card (Japanese) */}
      <meta name="twitter:title" content="Mangafy.Ai – ログインまたは登録" lang="ja" />
      <meta
        name="twitter:description"
        content="Mangafy.Aiに参加して、AI漫画作成ツールを使い始めましょう。今すぐアカウントを作成またはログイン！"
        lang="ja"
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
