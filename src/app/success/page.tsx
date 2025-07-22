// app/success/page.tsx

import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export default function SuccessPage() {
  return (
    <Suspense fallback={<p className="text-center p-6">Loading...</p>}>
      <SuccessClient />
    </Suspense>
  );
}
