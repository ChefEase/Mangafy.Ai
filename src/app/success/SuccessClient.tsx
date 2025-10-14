"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import '../success/successClient.css';

export default function SuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("session_id");

  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchSessionDetails() {
      if (!sessionId) return;

      try {
        const res = await fetch(`/api/get-session?session_id=${sessionId}`);
        const data = await res.json();

        if (res.ok) {
          setCredits(data.credits);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching session", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchSessionDetails();
  }, [sessionId]);

  // Redirect after 5 seconds
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        router.push("/project-management");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [loading, router]);

  // === Loading State ===
  if (loading) {
    return (
      <div className="verification-container">
        <div className="spinner"></div>
        <p className="verifying-text">Verifying your purchase...</p>
      </div>
    );
  }

  // === Error State ===
  if (error) {
    return (
      <div className="verification-container">
        <p className="error-text">
          ❌ Something went wrong. Please contact support.
        </p>
      </div>
    );
  }

  // === Success State ===
  return (
    <div className="verification-container">
      <div className="success-check">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={3}
          stroke="white"
          className="checkmark"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="success-title">🎉 Payment Successful!</h1>
      <p className="success-text">
        Thank you for your purchase. You’ve received{" "}
        <span className="font-semibold text-green-600">{credits}</span> new credits.
      </p>
      <p className="subtext">
        If credits haven’t updated yet, they will appear shortly.
      </p>
    </div>
  );
}
