"use client";

import React, { useState, useEffect } from "react";
import  supabase  from "@/utils/supabaseClient";
import Link from "next/link";
import "./styles/SubscriptionStatus.css";

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<"free" | "pro-monthly" | "pro-yearly">("free");

  useEffect(() => {
    const fetchSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setSubscription(user.user_metadata?.subscription || "free");
      }
    };

    fetchSubscription();
  }, []);

  return (
    <div className="subscription-status">
      <Link href="/subscription">
        <button>Upgrade to Premium</button>
      </Link>
    </div>
  );
}