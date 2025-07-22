import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Stripe from "stripe";

export default function SuccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const sessionId = router.query.session_id as string;

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

  if (loading) return <p className="text-center p-6">Verifying your purchase...</p>;

  if (error) return <p className="text-center text-red-500 p-6">Something went wrong. Please contact support.</p>;

  return (
    <div className="success-page text-center p-6">
      <h1 className="text-3xl font-bold mb-2">🎉 Payment Successful!</h1>
      <p className="text-lg mb-4">
        Thank you for your purchase. You've received{" "}
        <span className="font-semibold">{credits}</span> new credits.
      </p>
      <p className="text-sm text-gray-600">
        If credits haven't updated yet, they will appear shortly.
      </p>
    </div>
  );
}
