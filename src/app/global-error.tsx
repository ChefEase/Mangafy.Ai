"use client";

// Prevent static generation of global-error page
export const dynamic = "force-dynamic";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Global error:", error);

  return (
    <html>
      <body>
        <h2>Something went wrong.</h2>
        {process.env.NODE_ENV === "development" && error.message && (
          <p>Error: {error.message}</p>
        )}
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}