import React from "react";
import "./privacy-policy.css";

const PrivacyPolicy = () => {
  return (
    <div className="privacy-container">
      {/* Page Title */}
      <h1>
        Privacy Policy for Mangafy-ai <br />
        <span lang="ja">マガファイAIのプライバシーポリシー</span>
      </h1>
      <p>Last updated: July 19, 2025 <br />
        <span lang="ja">最終更新日: 2025年7月19日</span>
      </p>

      <p>
        This Privacy Policy describes Our policies and procedures on the collection, use, 
        and disclosure of Your information when You use the Service and tells You about 
        Your privacy rights and how the law protects You.
        <br />
        <span lang="ja">
          本プライバシーポリシーは、サービス利用時における情報の収集、利用、開示に関する当社の方針および手続きを説明し、
          お客様のプライバシー権利と法律による保護についてお知らせします。
        </span>
      </p>

      <h2>
        Interpretation and Definitions <br />
        <span lang="ja">解釈および定義</span>
      </h2>

      <h3>
        Interpretation <br />
        <span lang="ja">解釈</span>
      </h3>
      <p>
        Words with initial capital letters have meanings defined under the conditions below.
        <br />
        <span lang="ja">大文字で始まる用語は、以下の条件に基づいて定義されています。</span>
      </p>

      <h3>
        Definitions <br />
        <span lang="ja">定義</span>
      </h3>
      <ul>
        <li><strong>Account:</strong> A unique account created for You to access our Service. <br />
          <span lang="ja">アカウント：サービスを利用するために作成される一意のアカウント。</span>
        </li>
        <li><strong>Affiliate:</strong> An entity controlling or controlled by the Company. <br />
          <span lang="ja">関連会社：当社を支配、または当社に支配される事業体。</span>
        </li>
        <li><strong>Company:</strong> Refers to Mangafy-ai. <br />
          <span lang="ja">会社：Mangafy-aiを指します。</span>
        </li>
        <li><strong>Cookies:</strong> Small files placed on Your device to track activity. <br />
          <span lang="ja">クッキー：利用状況を追跡するためにデバイスに保存される小さなファイル。</span>
        </li>
        <li><strong>Country:</strong> New Brunswick, Canada <br />
          <span lang="ja">国：カナダ、ニューブランズウィック州</span>
        </li>
        <li><strong>Device:</strong> Any device used to access the Service. <br />
          <span lang="ja">デバイス：サービスにアクセスするために使用されるあらゆる機器。</span>
        </li>
        <li><strong>Personal Data:</strong> Information that identifies You. <br />
          <span lang="ja">個人データ：お客様を識別できる情報。</span>
        </li>
        <li><strong>Service:</strong> Refers to the Website. <br />
          <span lang="ja">サービス：本ウェブサイトを指します。</span>
        </li>
        <li>
          <strong>Website:</strong> Mangafy-ai, accessible from 
          <a href="https://www.mangafyai.com"> https://www.mangafyai.com</a> <br />
          <span lang="ja">ウェブサイト：Mangafy-ai（上記URLからアクセス可能）。</span>
        </li>
      </ul>

      {/* … you can repeat this pattern for other sections, keeping Japanese short if needed … */}

      <h2>
        Contact Us <br />
        <span lang="ja">お問い合わせ</span>
      </h2>
      <p>
        Email: <a href="mailto:mangaficustomercare@gmail.com">mangaficustomercare@gmail.com</a>
        <br />
        <span lang="ja">メール: 上記アドレスまでご連絡ください。</span>
      </p>
    </div>
  );
};

export default PrivacyPolicy;
