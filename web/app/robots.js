const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://what-to-wear.cms-building.at';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
