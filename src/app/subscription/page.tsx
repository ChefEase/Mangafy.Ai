"use client";

import React from "react";
import Link from "next/link";
import "./SubscriptionPage.css";
import { useCredits } from "@/context/CreditContext"; // Adjust the path as needed
import { useUser } from "@/context/UserContext";

interface Plan {
  type: string;
  price: string;
  features: string[];
  buttonText: string;
  disabled: boolean;
  credits: number;
}


export default function SubscriptionPage() {
  const { addCredits } = useCredits();

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
      price: "$0/month",
      features: ["One-time 195 Free Credits", "6-16 Pages Generated"],
      buttonText: "Current Plan",
      disabled: true,
      credits: 0,
    },
    {
      type: "Manga Starter",
      price: "$9.99/month",
      features: ["600 Credits", "25-50 Pages Generated"],
      buttonText: "Upgrade to Pro",
      disabled: false,
      credits: 600,
    },
    {
      type: "Story Teller",
      price: "$19.99/month",
      features: ["1400 Credits", "50-100 Pages Generated"],
      buttonText: "Upgrade to Pro",
      disabled: false,
      credits: 1400,
    },
    {
      type: "Story Teller Pro",
      price: "$39.99/month",
      features: ["3200 Credits", "100-150 Pages Generated"],
      buttonText: "Upgrade to Pro",
      disabled: false,
      credits: 3200,
    },
    {
      type: "Creator Pro",
      price: "$79.99/month",
      features: ["7200 Credits", "150-200 Pages Generated"],
      buttonText: "Upgrade to Pro",
      disabled: false,
      credits: 7200,
    },
    {
      type: "Studio Premium",
      price: "$149.99/month",
      features: ["16,000 Credits", "200-400 Pages Generated"],
      buttonText: "Upgrade to Pro",
      disabled: false,
      credits: 16000,
    },
  ];
  
  const yearlyPlans = [
    {
      type: "Manga Starter",
      price: "$99.99/year",
      features: ["600 Credits", "25-50 Pages Generated"],
      buttonText: "Upgrade to Pro",
      disabled: false,
      credits: 600,
    },
    {
      type: "Story Teller",
      price: "$199.99/year",
      features: ["1400 Credits", "50-100 Pages Generated"],
      buttonText: "Upgrade to Pro",
      disabled: false,
      credits: 1400,
    },
    {
      type: "Story Teller Pro",
      price: "$399.99/year",
      features: ["3200 Credits", "100-150 Pages Generated"],
      buttonText: "Upgrade to Pro",
      disabled: false,
      credits: 3200,
    },
    {
      type: "Creator Pro",
      price: "$799.99/year",
      features: ["7200 Credits", "150-200 Pages Generated"],
      buttonText: "Upgrade to Pro",
      disabled: false,
      credits: 7200,
    },
    {
      type: "Studio Premium",
      price: "$1499.99/year",
      features: ["16,000 Credits", "200-400 Pages Generated"],
      buttonText: "Upgrade to Pro",
      disabled: false,
      credits: 16000,
    },
  ];

  const handlePurchase = async (credits: number) => {
    await addCredits(credits);
    alert(`🎉 You've been awarded ${credits} credits!`);
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
        <button onClick={() => handlePurchase(plan.credits)}>
          {plan.buttonText}
        </button>
      </div>
    ));
    
  return (
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
  );
}
