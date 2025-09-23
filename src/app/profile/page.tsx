"use client";

import React, { useEffect } from "react";
import ProfileForm from "../../components/Profile/ProfileForm";
import SubscriptionStatus from "../../components/Profile/SubscriptionStatus";
import {LogoutButton} from "../../components/Profile/LogOutButton"; // ✅ You imported this correctly
import UsageTracker from "../../components/Profile/UsageTracker";
import "../../components/Profile/styles/ProfileForm.css";
import Head from "next/head";

export default function ProfilePage() {
  useEffect(() => {
    console.log("🔄 Refreshing Usage Tracker...");
    window.dispatchEvent(new CustomEvent("projectCreated"));
  }, []);

  return (
    <>
       <Head>
  {/* English Meta */}
  <title>Profile – Mangafy.Ai</title>
  <meta
    name="description"
    content="Manage your Mangafy.Ai profile, subscription, and usage. Log in with Google and keep creating amazing manga panels and stories effortlessly."
  />

  {/* Japanese Meta */}
  <meta
    name="description"
    lang="ja"
    content="Mangafy.Aiプロフィールを管理し、サブスクリプションや利用状況を確認できます。Googleでログインして、手軽に漫画パネルやストーリーを作成しましょう。"
  />

  {/* Open Graph */}
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://www.mangafyai.com/profile" />
  <meta property="og:title" content="Profile – Mangafy.Ai" />
  <meta
    property="og:description"
    content="Manage your Mangafy.Ai profile, subscription, and usage. Log in with Google and keep creating amazing manga panels and stories effortlessly."
  />
  <meta
    property="og:description"
    lang="ja"
    content="Mangafy.Aiプロフィールを管理し、サブスクリプションや利用状況を確認できます。Googleでログインして、漫画制作をもっと楽しみましょう。"
  />
  <meta property="og:image" content="https://www.mangafyai.com/logo.png" />

  {/* Twitter */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://www.mangafyai.com/profile" />
  <meta name="twitter:title" content="Profile – Mangafy.Ai" />
  <meta
    name="twitter:description"
    content="Manage your Mangafy.Ai profile, subscription, and usage. Log in with Google and keep creating amazing manga panels and stories effortlessly."
  />
  <meta
    name="twitter:description"
    lang="ja"
    content="Mangafy.Aiプロフィールを管理し、サブスクリプションや利用状況をチェック。Googleでログインして、簡単に漫画パネルやストーリーを作ろう。"
  />
  <meta name="twitter:image" content="https://www.mangafyai.com/logo.png" />
</Head>
    <div className="profile-page">
      <h1>Your Profile</h1>

      <div className="profile-section">
        <h2>Profile Information</h2>
        <ProfileForm />
      </div>

      <div className="subscription-section">
        <h2>Subscription Status</h2>
        <SubscriptionStatus />
      </div>

      <div className="usage-section">
        <h2>Usage Tracking</h2>
        <UsageTracker />
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <LogoutButton /> {/* ✅ Correctly render the reusable logout button */}
      </div>
    </div>
    </>
  );
}
