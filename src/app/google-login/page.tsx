import { GoogleLoginButton } from "../../components/Auth/GoogleLoginButton";
export const dynamic = "force-dynamic";
import Head from "next/head";  // import Head

export default function GoogleLoginPage() {
  return (
    <div>
       <Head>
    <title>Google Login – Mangafy.Ai</title>
    <meta
      name="description"
      content="Log into with your google account and start creating amazing manga panels and stories."
    />
    {/* Open Graph */}
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://mangafy-ai.vercel.app/google-login" />
    <meta property="og:title" content="Google Login – Mangafy.Ai" />
    <meta
      property="og:description"
      content="Log into with your google account and start creating amazing manga panels and stories."
    />
    <meta property="og:image" content="https://mangafy-ai.vercel.app/logo.png" />

    {/* Twitter */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://mangafy-ai.vercel.app/google-login" />
    <meta name="twitter:title" content="Google Login – Mangafy.Ai" />
    <meta
      name="twitter:description"
      content="Log into with your google account and start creating amazing manga panels and stories."
    />
    <meta name="twitter:image" content="https://mangafy-ai.vercel.app/logo.png" />
  </Head>
      <h1>Login with Google</h1>
      <GoogleLoginButton />
    </div>
  );
}