"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "@/public/logo.png"; // Replace with your logo

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/Entire-Home-Auth-Page");
    }, 6000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="splash-container">
      <div className="splash-content">
        <div className="splash-badge">Mangafy.Ai</div>
        <Image
          src={Logo}
          alt="Manga Creator Logo"
          width={420}
          height={320}
          className="splash-logo"
        />
        <h1 className="splash-title">Turn ideas into manga scenes in minutes.</h1>
        <p className="splash-subtitle">
          Start with one sentence or an image. No credit card required.
        </p>
        <button
          className="splash-cta"
          onClick={() => router.push("/Entire-Home-Auth-Page")}
        >
          Start Creating for Free
        </button>
        <p className="splash-trust">Made for writers and manga creators, not prompt engineers.</p>
      </div>
    </div>
  );
}
