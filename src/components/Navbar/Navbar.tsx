"use client";

import React from "react";
import "./Navbar.css";

interface NavbarProps {
  setActiveForm: (form: "register" | "login" | "reset-password" | "google-login") => void;
}

export const Navbar = ({ setActiveForm }: NavbarProps) => {
  return (
    <nav className="navbar">
     <div className="navbar-logo">
        <img src="/logo.png" alt="Mangafy Logo" className="logo-icon" />
        <span>Mangafy.Ai</span>
      </div>
      <ul className="navbar-links">
        <li>
          <button onClick={() => setActiveForm("register")}>Register</button>
        </li>
        <li>
          <button onClick={() => setActiveForm("login")}>Login</button>
        </li>
        <li>
          <button onClick={() => setActiveForm("reset-password")}>Reset Password</button>
        </li>
        <li>
          <button onClick={() => setActiveForm("google-login")}>Login with Google</button>
        </li>
      </ul>
    </nav>
  );
};