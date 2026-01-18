// app/reset-password/page.tsx
import React, { Suspense } from "react";
import ResetPasswordPageContent from "./ResetPasswordPageContent";

export const metadata = {
  title: "Reset Password - Mangafy.Ai",
  description:
    "Reset your password if you forgot it and get back to creating manga panels.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading reset page...</div>}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
