"use client";

import React from "react";
import Link from "next/link";
import "./SubscriptionPage.css";
import { useCredits } from "@/context/CreditContext"; // Adjust the path as needed
import { useUser } from "@/context/UserContext";
import Head from "next/head";

interface Plan {
  type: string;
  price: string;
  features: string[];
  buttonText: string;
  disabled: boolean;
  credits: number;
  priceId?: string; // ✅ Add this
}


export default function SubscriptionPage() {
  const { addCredits } = useCredits();
  const { user } = useUser(); // ✅ Move this here

  function InviteSection() {
    const { user } = useUser();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const referralLink = `${siteUrl}/Entire-Home-Auth-Page?ref=${user?.id}`;
  
    const handleCopy = () => {
      navigator.clipboard.writeText(referralLink);
      alert("Referral link copied to clipboard!");
    };
    return (
      <div className="invite-section">
      <h3>Invite a Friend & Earn Credits!</h3>
      <p>
        Share your referral link and earn <strong>150 credits</strong> when your friend signs up.
        <br />
        <span className="text-sm text-red-500 font-medium">
          Important: To receive referral credits, your friend must create their account using the
          Register or Login form — not the "Continue with Google" option.
        </span>
      </p>
      <div className="referral-container">
        <input
          className="referral-input"
          value={referralLink}
          readOnly
          onClick={(e) => e.currentTarget.select()}
        />
        <button className="copy-button" onClick={handleCopy}>Copy Link</button>
      </div>
    </div>
      );
  
  }
  const monthlyPlans = [
    {
      type: "Free",
      price: "$0",
      features: [
        "🎁 One-time 195 Free Credits",
        "📦 Access All Core Features",
        "🤖 Character & Story Generation"
      ],
      buttonText: "Current Plan",
      disabled: true,
      credits: 0,
    },
    {
      type: "Starter Creator",
      price: "$9.99",
      priceId: "price_1RnV3NCfqQf6EFEyrJGUcfkP",
      features: [
        "🔓 1,200 Credits",
        "🧠 Character Consistency AI",
        "🎨 Cover Art & Story Generator",
        "🎁 Referral: Earn 125 Credits Each"
      ],
      buttonText: "Get Starter Creator",
      disabled: false,
      credits: 1200,
    },
    {
      type: "Ultimate Creator",
      price: "$24.99",
      priceId: "price_1RnV5nCfqQf6EFEyvx3H79KA",
      features: [
        "🚀 3,500 Credits",
        "🔥 Early Access to New Features",
        "👥 Priority Support & Creator Chatbot",
        "🎁 Referral: Earn 125 Credits Each"
      ],
      buttonText: "Go Ultimate",
      disabled: false,
      credits: 3500,
    },
  ];
    
  const yearlyPlans = [
    {
      type: "Starter Creator (Yearly)",
      price: "$95.99",
      priceId:"price_1RnV9mCfqQf6EFEyBT96MPqv",
      features: [
        "🚀 14,400 Credits",
        "💰 Save 20% (Normally $120)",
        "🧠 Character Consistency AI",
        "🎨 Cover Art & Story Generator",
        "🎁 Referral: Earn 125 Credits Each"
      ],
      buttonText: "Get Yearly Starter",
      disabled: false,
      credits: 14400,
    },
    {
      type: "Ultimate Creator (Yearly)",
      price: "$239.99",
      priceId: "price_1RnVCJCfqQf6EFEyvODEySQl",
      features: [
        "🚀 42,000 Credits",
        "🔥 Early Access to New Features",
        "👥 Priority Support & Creator Chatbot",
        "🎁 Referral: Earn 125 Credits Each"
      ],
      buttonText: "Go Yearly Ultimate",
      disabled: false,
      credits: 42000,
    },
  ];
  
  const handlePurchase = async (priceId: string) => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, userId: user?.id }),
    });
  
    const text = await res.text(); // safer than res.json()
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {}
  
    if (!res.ok) {
      console.error("Checkout failed:", res.status, data);
      alert(data?.error || "Checkout failed");
      return;
    }
  
    if (data.url) window.location.href = data.url;
  };
  
  const renderPlans = (plans: Plan[]) =>
    plans.map((plan, index) => (
      <div key={index} className="plan-card">
        <h2>{plan.type}</h2>
        <p className="price">{plan.price}</p>
        <ul>
          {plan.features.map((feature, i) => (
            <li key={i}>{feature}</li>
          ))}
        </ul>
        <button onClick={() => handlePurchase(plan.priceId!)}>
          {plan.buttonText}
        </button>
      </div>
    ));
    
  return (
    <>
    <Head>
  <title>Subscription – Mangafy.Ai</title>
  <meta
    name="description"
    content="Manage your Mangafy.Ai subscription plans with ease. Upgrade or renew your subscription to keep creating amazing manga with AI-powered tools."
  />
  {/* Open Graph */}
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://www.mangafyai.com//subscription" />
  <meta property="og:title" content="Subscription – Mangafy.Ai" />
  <meta
    property="og:description"
    content="Manage your Mangafy.Ai subscription plans with ease. Upgrade or renew your subscription to keep creating amazing manga with AI-powered tools."
  />
  <meta property="og:image" content="https://www.mangafyai.com//logo.png" />

  {/* Twitter */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://www.mangafyai.com//subscription" />
  <meta name="twitter:title" content="Subscription – Mangafy.Ai" />
  <meta
    name="twitter:description"
    content="Manage your Mangafy.Ai subscription plans with ease. Upgrade or renew your subscription to keep creating amazing manga with AI-powered tools."
  />
  <meta name="twitter:image" content="https://www.mangafyai.com//logo.png" />
</Head>

    <div className="subscription-page">
      <InviteSection />
      <h1>Choose Your Plan</h1>
      <section>
        <h2>Monthly Plans</h2>
        <div className="plans-container">{renderPlans(monthlyPlans)}</div>
      </section>

      <section>
        <h2>Yearly Plans</h2>
        <div className="plans-container">{renderPlans(yearlyPlans)}</div>
      </section>
    </div>
    </>
  );
}
