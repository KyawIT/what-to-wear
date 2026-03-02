const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://what-to-wear.cms-building.at';

export default function sitemap() {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
