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
      <Navbar setActiveForm={setActiveForm} />
      <div className="form-container">
        {activeForm === "register" && <RegisterForm referrerId={referrerId}/>}
        {activeForm === "login" && <LoginForm />}
        {activeForm === "reset-password" && <ResetPasswordForm />}
      {/*}  {activeForm === "google-login" && <GoogleLoginButton />} */}
      </div> 
    </div>
  );
}
