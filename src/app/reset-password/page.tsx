// app/reset-password/page.tsx
import React, { Suspense } from "react";
import ResetPasswordPageContent from "./ResetPasswordPageContent";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading reset page...</div>}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
