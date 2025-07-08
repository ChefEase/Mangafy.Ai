import { GoogleLoginButton } from "../../components/Auth/GoogleLoginButton";
export const dynamic = "force-dynamic";

export default function GoogleLoginPage() {
  return (
    <div>
      <h1>Login with Google</h1>
      <GoogleLoginButton />
    </div>
  );
}