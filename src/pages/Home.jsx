import React from "react";
import { RegisterForm } from "../components/Auth/RegisterForm";
import { LoginForm } from "../components/Auth/LoginForm";
import { ResetPasswordForm } from "../components/Auth/ResetPasswordForm";
import { GoogleLoginButton } from "../components/Auth/GoogleLoginButton";
import "./Home.css";

export const Home = () => {
  return (
    <div className="home">
      <Image />
      <RegisterForm />
      <LoginForm />
      <ResetPasswordForm />
      <GoogleLoginButton />
    </div>
  );
};