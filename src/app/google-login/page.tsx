import { GoogleLoginButton } from "../../components/Auth/GoogleLoginButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Google Login - Mangafy.Ai",
  description:
    "Log in with your Google account and start creating amazing manga panels and stories.",
};

export default function GoogleLoginPage() {
  return (
    <div>
      <h1>Login with Google</h1>
      <GoogleLoginButton />
    </div>
  );
}
