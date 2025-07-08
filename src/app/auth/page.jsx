import React, { Suspense } from "react";
import AuthCallback from "./AuthCallback"; // Your existing file

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Authenticating...</div>}>
      <AuthCallback />
    </Suspense>
  );
}
