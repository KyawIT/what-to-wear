import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Philosophy from '@/components/Philosophy';
import Protocol from '@/components/Protocol';
import Waitlist from '@/components/Waitlist';
import Team from '@/components/Team';
import Footer from '@/components/Footer';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://what-to-wear.cms-building.at';

function JsonLd() {
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'What to Wear',
      alternateName: 'WTW',
      url: SITE_URL,
      description:
        'AI-powered wardrobe management app. Upload your clothes, organize by category, remove backgrounds automatically, and get smart outfit suggestions from what you already own.',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'iOS, Android',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/PreOrder',
      },
      featureList: [
        'AI background removal for clothing photos',
        'Automatic wardrobe categorization',
        'Smart outfit suggestions',
        'Weekly outfit scheduling',
        'Digital closet organizer',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'What to Wear',
      url: SITE_URL,
      logo: `${SITE_URL}/og-image.png`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the What to Wear app?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'What to Wear is an AI-powered wardrobe management app that helps you organize your clothes, remove photo backgrounds automatically, and get smart outfit suggestions based on what you already own.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does the outfit suggestion feature work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Upload photos of your clothing items. Our AI categorizes them automatically, then analyzes your wardrobe to suggest outfit combinations that work well together based on style, color, and occasion.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is What to Wear free to use?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'What to Wear is currently in pre-launch. Join our waitlist for free to get early access when the app launches on iOS and Android.',
          },
        },
        {
          '@type': 'Question',
          name: 'What to wear today?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Not sure what to wear today? The What to Wear app analyzes your wardrobe and suggests outfits based on your clothes, the weather, and your schedule. Join the waitlist to try it.',
          },
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'What to Wear',
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

export default function Home() {
  return (
    <>
      <JsonLd />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Philosophy />
        <Protocol />
        <Waitlist />
        <Team />
      </main>
      <Footer />
    </>
  );
}
