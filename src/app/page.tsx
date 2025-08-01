'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Logo from '@/public/logo.png';
import styles from './LandingPage.module.css';
import { useRouter } from 'next/navigation';

const MANGA_SAMPLES: { pages: string[] }[] = [
  {
    pages: [
      '/samples/Chapter1.png',
      '/samples/page 2.png',
      '/samples/page 3.png',
    ],
  },
  {
    pages: [
      /*'/samples/sample2-left.png',
      '/samples/sample2-center.png',
      '/samples/sample2-right.png',*/
    ],
  },
  {
    pages: [
      /*'/samples/sample3-left.png',
      '/samples/sample3-center.png',
      '/samples/sample3-right.png',*/
    ],
  },
];


const CAROUSEL_IMAGES = [
  '/samples/sample1.png',
  '/samples/sample2.png',
  '/samples/sample3.png',
  '/samples/sample 4.png',
  '/samples/sample5.png',
  '/samples/sample 6.png',
  '/samples/sample 7.jpeg',
  '/samples/sample 8.png',
  '/samples/sample9.png',
  '/samples/sample 10.png',
  '/samples/sample11.png',
  '/samples/sample12.png',  
  '/samples/sample 13.png',  
  '/samples/sample14.png', 
  '/samples/sample15.png', 
  '/samples/sample16.png', 
  '/samples/sample17.png', 
  // ... add up to 30*/
];

const FEATURES = [
  {
title: 'Ai Character Consistency Engine',
description: 'Mangafy.ai uses your uploaded characters and their descriptions to maintain consistent appearances across all manga panels. Our AI parses character roles, traits, and visuals from your input to ensure visual continuity. The more detailed and concise the description, the better the results with up to 85% accuracy in maintaining character consistency across scenes.',
media: '/samples/sample3.png',
  },
  {
    title: 'AI Story-to-Manga Conversion',
    description: `Turn your written stories into fully illustrated manga pages with a single click.
  Our intelligent pipeline understands narrative structure, dialogue, and visual context allowing it to transform raw text into manga panels with dynamic compositions, expressive characters, and cinematic flow.
  You can specify panel layout, camera angles, and style preferences to tailor the output to your vision. It's storytelling, visually automated.`,
    media: '/features/feature2.mp4', // Replace with your actual video file path
    isVideo: true
  },
  {
    title: 'Custom Character Generation',
    description:
      'Create unique manga characters with AI tailored to your story’s style. Whether you need a stoic warrior, a whimsical sidekick, or a mysterious villain, Mangafy.ai allows you to generate characters based on detailed prompts, personality traits, and design preferences. Customize clothing, expressions, poses, and more, ensuring every character feels authentic and visually aligned with your manga universe.',
    media: '/features/feature4.mp4',
    isVideo: true
  },
  {
    title: 'Image-to-Image Transformation',
    description:
      'Upload your own sketches or character art and watch them come to life as polished manga-style illustrations. Mangafy.ai enhances your visuals with AI while preserving core details like pose, expression, and costume perfect for refining concept art or adapting existing characters into manga format.',
    media: '/features/image-to-image.mp4',
    isVideo: true
  },
  {
    title: 'AI Story Panel Generator',
    description:
      'Effortlessly create manga-style stories with our AI-powered panel generator. Choose from a variety of story templates or generate original plots, then apply them directly to your script box. Each story is broken into dynamic panels ready for editing, making storytelling faster, more flexible, and visually captivating.',
    media: '/features/feature3.mp4',
    isVideo: true
  },
  {
    title: 'AI Cover Art Creator',
    description:
      'Design stunning manga-style cover pages using our AI-powered generator. Upload your own characters or use pre-saved ones to generate personalized covers with dynamic artwork. Once generated, customize your cover with editable text, fonts, colors, and visual effects — all in real-time. Perfect for creators who want total control over both the art and design.',
    media: '/features/feature1.mp4',
    isVideo: true
  },
  
  {
    title: 'AI Chatbot with Image Upload',
    description:
      'Engage in seamless conversations with our AI chatbot that understands and responds in real-time. Upload images to ask questions or get insights based on the visual content. Supports file uploads with a size limit to ensure smooth performance. Perfect for interactive chats that combine text and images effortlessly.',
    media: '/features/feature5.png',
  }
  
];

const PRICING = [
  { plan: 'Free', price: '$0', perks: ['Limited manga generations', 'Basic features'] },
  { plan: 'Pro', price: '$9.99/mo', perks: ['Unlimited manga creations', 'Advanced AI styles', 'Priority support'] },
];

const FAQ = [
  {
    question: 'How does Mangafy.ai work?',
    answer: 'Our AI takes your story input, character pictures and description and generates manga illustrations automatically.',
  },
  {
    question: 'Do I need to be an artist?',
    answer: 'No, Mangafy.ai creates all the art for you based on your story input.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards through our secure payment partner, Stripe.',
  },
  {
    question: 'What apps work well with Mangafy-Ai?',
    answer: 'We recommend Photoshop or any editing app with text bubbles and inpainting tools.',
  }
  
];

export default function LandingPage() {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const router = useRouter();

  // Handler functions
  const handleChooseFree = () => {
    router.push('/Entire-Home-Auth-Page');
  };

  const handleChoosePro = () => {
    router.push('/subscription');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((idx) => (idx + 1) % CAROUSEL_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className={styles.main}>
      {/* Floating vertical carousel behind header */}
      <div className={styles.carouselContainer}>
        <div className={styles.carouselInner}>
          {CAROUSEL_IMAGES.map((img, i) => (
            <div
              key={i}
              className= {styles.carouselItem}>
              <Image
                src={img}
                alt={`Sample manga carousel ${i + 1}`}
                width={150}
                height={250}
                className={styles.carouselImage}
                priority={i === carouselIndex}
              />
            </div>
          ))}
        </div>
      </div>

      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <Image src={Logo} alt="Mangafy.ai Logo" width={48} height={48} />
          <span className={styles.logoText}>Mangafy.ai</span>
        </div>
      </header>

      {/* HERO */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Welcome to Mangafy-ai</h1>
        <p className={styles.heroSubtitle}>
          Where imagination becomes reality. Create comics and manga with AI.
          <br />
          With one click, turn your stories into manga.
        </p>
        <Link href="/splash-screen" legacyBehavior>
          <a className={styles.ctaButton}>Try Mangafy Now For Free</a>
        </Link>
      </section>
      <Image
    src="/hero_visible_left.jpg"
    alt="Visible Manga Left"
    className={styles.heroImageLeft}
    width={180}
    height={260}
  />
  <Image
    src="/hero_visible_right.jpg"
    alt="Visible Manga Right"
    className={styles.heroImageRight}
    width={180}
    height={260}
  />
<section className={styles['how-to-generate-section']}>
      <h2 className={styles['section-title']}>How to Generate Manga with Mangafy.ai</h2>
      <div className={styles['steps-container']}>
        
        <div className={styles['step-card']}>
          <img src="/steps/daichi.jpeg" alt="Step 1" className={styles['step-image']} />
          <h3 className={styles['step-title']}>Step 1: Get Your Character</h3>
          <p className={styles['step-description']}>Use a reference or image for your character idea.</p>
        </div>

        <div className={styles['step-card']}>
          <img src="/steps/step2.png" alt="Step 2" className={styles['step-image']} />
          <h3 className={styles['step-title']}>Step 2: Upload Character</h3>
          <p className={styles['step-description']}>Upload it, name it, and describe the physical features, role (e.g., protagonist).</p>
        </div>

        <div className={styles['step-card']}>
          <img src="/steps/step3.png" alt="Step 3" className={styles['step-image']} />
          <h3 className={styles['step-title']}>Step 3: Write Your Story</h3>
          <p className={styles['step-description']}>Describe each panel with characters, background, and camera angle.</p>
        </div>

        <div className={styles['step-card']}>
          <div className="image-wrapper">
          <img src="/steps/step4.png" alt="Step 4" className={styles['step-image']} />
          <img src="/icons/mouse.png" alt="Mouse icon" className={styles['mouse-icon']} />
          </div>
          <h3 className={styles['step-title']}>Step 4: Choose Style & Generate</h3>
          <p className={styles['step-description']}>Pick art style, color or B&W, and hit generate!</p>
        </div>

      </div>
    </section>

      {/* SAMPLES */}
      <section className={styles.samplesSection}>
        <h2 className={styles.sectionTitle}>See Mangafy-Ai in Action</h2>
        <div className={styles.samplesWrapper}>
          {MANGA_SAMPLES.map((sample : { pages: string[] }, i: number) => (
            <div key={i} className={styles.sampleRow}>
              {sample.pages.map((page: string, idx: number) => (
                <div key={idx} className={styles.samplePage}>
                  <Image
                    src={page}
                    alt={`Sample manga page ${idx + 1}`}
                    width={600}
                    height={850}
                    className={styles.sampleImage}
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.featuresSection}>
        <h2 className={styles.sectionTitleFeatures}>Features</h2>
        {FEATURES.map(({ title, description, media, isVideo }, i) => (
          <div key={i} className={styles.featureItem}>
            <div className={styles.featureText}>
              <h3 className={styles.featureTitle}>{title}</h3>
              <p className={styles.featureDescription}>{description}</p>
            </div>
            <div className={styles.featureMedia}>
            {isVideo ? (
        <video
          src={media}
          width={500}
          height={350}
          className={styles.featureImage}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <Image
          src={media}
          alt={title}
          width={500}
          height={350}
          className={styles.featureImage}
        />
      )}
            </div>
          </div>
        ))}
      </section>

      {/* PRICING */}
      <section className={styles.pricingSection}>
        <h2 className={styles.sectionTitlePricing}>Pricing</h2>
        <div className={styles.pricingWrapper}>
          {PRICING.map(({ plan, price, perks }) => (
            <div key={plan} className={styles.pricingCard}>
              <h3 className={styles.pricingPlan}>{plan}</h3>
              <p className={styles.pricingPrice}>{price}</p>
              <ul className={styles.pricingPerks}>
                {perks.map((perk, idx) => (
                  <li key={idx}>{perk}</li>
                ))}
              </ul>
              <button
                className={styles.pricingButton}
                onClick={plan === 'Free' ? handleChooseFree : handleChoosePro}
              >
                Choose {plan}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faqSection}>
        <h2 className={styles.sectionTitleFaq}>FAQ</h2>
        {FAQ.map(({ question, answer }, i) => (
          <div key={i} className={styles.faqItem}>
            <h4 className={styles.faqQuestion}>{question}</h4>
            <p className={styles.faqAnswer}>{answer}</p>
          </div>
        ))}
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <p>
          Contact us: <a href="mailto:mangaficustomercare@gmail.com" className={styles.footerLink}>mangaficustomercare@gmail.com</a>
        </p>
        <p>
          Follow us on{' '}
          <a
            href="https://instagram.com/mangafy.ai"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            Instagram
          </a>
        </p>
        <p className={styles.footerCopy}>© 2025 Mangafy.ai</p>
      </footer>
    </main>
  );
}
