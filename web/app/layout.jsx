import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://what-to-wear.cms-building.at';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'What to Wear — AI Wardrobe Management App | Outfit Planner',
    template: '%s | What to Wear',
  },
  description:
    'What to Wear is an AI-powered wardrobe management app. Upload your clothes, remove backgrounds automatically, organize by category, and get smart outfit suggestions from what you already own. Free to join the waitlist.',
  keywords: [
    'what to wear',
    'what to wear today',
    'what to wear app',
    'outfit planner',
    'wardrobe management',
    'wardrobe organizer',
    'outfit ideas',
    'closet organizer app',
    'AI wardrobe',
    'outfit suggestion',
    'clothing organizer',
    'digital wardrobe',
    'smart closet',
    'outfit of the day',
    'what should I wear',
    'daily outfit planner',
    'wardrobe app',
    'capsule wardrobe',
    'outfit generator',
    'fashion app',
  ],
  authors: [{ name: 'What to Wear' }],
  creator: 'What to Wear',
  publisher: 'What to Wear',
  category: 'Fashion & Lifestyle',
  applicationName: 'What to Wear',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'What to Wear — AI Wardrobe Management & Outfit Planner',
    description:
      'Upload your clothes, organize your wardrobe, and get AI-powered outfit suggestions from what you already own. Join the waitlist today.',
    url: SITE_URL,
    siteName: 'What to Wear',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'What to Wear — AI-powered wardrobe management app showing outfit suggestions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What to Wear — AI Wardrobe Management & Outfit Planner',
    description:
      'Upload your clothes, organize your wardrobe, and get AI-powered outfit suggestions. Join the waitlist.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  verification: {
    // Add these when you have them:
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F2F0E9' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1A1A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=IBM+Plex+Mono:wght@400;500&family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="noise-overlay bg-cream text-charcoal font-heading antialiased">
        {children}
      </body>
    </html>
  );
}
