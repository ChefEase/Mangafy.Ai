import { LoginForm } from "../../components/Auth/LoginForm";
import Head from "next/head";

export default function LoginPage() {
  return (
    <>
   <Head>
  {/* English */}
  <title>Login – Mangafy.Ai</title>
  <meta
    name="description"
    content="Log into your account and start creating amazing manga panels and stories."
  />

  {/* Japanese */}
  <title lang="ja">ログイン – Mangafy.Ai</title>
  <meta
    name="description"
    lang="ja"
    content="アカウントにログインして、素晴らしいマンガのパネルやストーリーを作成しましょう。"
  />

  {/* Open Graph */}
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://www.mangafyai.com/login" />
  <meta property="og:title" content="Login – Mangafy.Ai" />
  <meta
    property="og:description"
    content="Log into your account and start creating amazing manga panels and stories."
  />
  <meta
    property="og:description"
    lang="ja"
    content="アカウントにログインして、素晴らしいマンガのパネルやストーリーを作成しましょう。"
  />
  <meta property="og:image" content="https://www.mangafyai.com/logo.png" />

  {/* Twitter */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://www.mangafyai.com/login" />
  <meta name="twitter:title" content="Login – Mangafy.Ai" />
  <meta
    name="twitter:description"
    content="Log into your account and start creating amazing manga panels and stories."
  />
  <meta
    name="twitter:description"
    lang="ja"
    content="アカウントにログインして、素晴らしいマンガのパネルやストーリーを作成しましょう。"
  />
  <meta name="twitter:image" content="https://www.mangafyai.com/logo.png" />
</Head>

    <div>
      <LoginForm />
    </div>
    </>
  );
}