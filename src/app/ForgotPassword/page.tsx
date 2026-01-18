// app/ForgotPassword/page.tsx
import { Suspense } from "react";
import UpdatePasswordPageContent from "./UpdatePasswordPageContext";

export const dynamic = "force-dynamic"; // key: prevents prerender
export const revalidate = 0;

export const metadata = {
  title: "Forgot Password – Mangafy.Ai",
  description:
    "Reset your Mangafy.Ai account password quickly and securely. Get back to creating amazing manga panels and stories.",
  openGraph: {
    type: "website",
    url: "https://www.mangafyai.com/ForgotPassword",
    title: "Forgot Password – Mangafy.Ai",
    description:
      "Reset your Mangafy.Ai account password quickly and securely. Get back to creating amazing manga panels and stories.",
    images: ["https://www.mangafyai.com/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Forgot Password – Mangafy.Ai",
    description:
      "Reset your Mangafy.Ai account password quickly and securely. Get back to creating amazing manga panels and stories.",
    images: ["https://www.mangafyai.com/logo.png"],
  },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading forgot password...</div>}>
      <UpdatePasswordPageContent />
    </Suspense>
  );
}
