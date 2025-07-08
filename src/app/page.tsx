'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Logo from '@/public/logo.png'; // Replace with your logo

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/Entire-Home-Auth-Page');
    }, 3500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="splash-container">
      <div className="splash-content">
        <Image 
          src={Logo} 
          alt="Manga Creator Logo" 
          width={480} 
          height={360}
          className="splash-logo"
        />
        <div className="curated-by">
        Mangafy.Ai – Where Imagination Becomes Manga. 🎨✨
        </div>
      </div>
    </div>
  );
}