"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/project-management");
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferrerId(ref);
      localStorage.setItem("referrerId", ref);  // ✅ SAVE TO LOCAL STORAGE HERE
    }

    checkSession();
  }, [router]);

  return (
    <div className="home">
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
