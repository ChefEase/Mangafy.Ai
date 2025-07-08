'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/Entire-Home-Auth-Page');
    }, 3500); // 3.5 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="splash-container">
      <div className="splash-content">
        {/* Replace with your logo */}
        <div className="logo-placeholder" />
        <div className="curated-by">
          curated by Your Brand
        </div>
      </div>
    </div>
  );
}