// app/ForgotPassword/page.tsx
import React, { Suspense } from "react";
import UpdatePasswordPageContent from "./UpdatePasswordPageContext";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading forgot password...</div>}>
      <UpdatePasswordPageContent />
    </Suspense>
  );
}
