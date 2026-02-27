const BASE_URL = (process.env.EXPO_PUBLIC_BACKEND_ROOT ?? "http://localhost:8080")
  .replace(/\/+$/, "");

const SCRAPER_ENDPOINT = "/api/wearableai/scraper";
const SCRAPER_TIMEOUT_MS = 15000;

// ── Vendor response types ──────────────────────────────────────────

// Field names match Jackson @JsonProperty annotations in backend DTOs
// (snake_case is used for serialization in both directions)

export type HmScrapeResponse = {
  name: string;
  article_code: string;
  price: string;
  colors: string[];
  sizes: string[];
  images: string[];
};

export type PinterestScrapeResponse = {
  pin_id: string;
  url: string;
  name: string;
  description: string;
  post_name: string;
  image_url: string;
};

export type ZalandoScrapeResponse = {
  product_id: string;
  url: string;
  name: string;
  description: string;
  post_name: string;
  image_url: string;
  brand: string;
  category: string;
  color: string;
  price: string;
};

// ── Common types ───────────────────────────────────────────────────

export type VendorSource = "hm" | "zalando" | "pinterest";

export type ScrapedPreviewData = {
  name: string;
  description: string;
  imageUrl: string;
  images?: string[];
  tags: string[];
  vendor: VendorSource;
};

// ── Vendor detection ───────────────────────────────────────────────

const VENDOR_RULES: { vendor: VendorSource; patterns: RegExp[] }[] = [
  { vendor: "zalando", patterns: [/zalando\./i] },
  { vendor: "hm", patterns: [/\bhm\.com\b/i, /\bwww2\.hm\.com\b/i, /\bh&m\b/i] },
  { vendor: "pinterest", patterns: [/pinterest\./i, /pin\.it/i] },
];

export function detectVendor(url: string): VendorSource | null {
  for (const rule of VENDOR_RULES) {
    if (rule.patterns.some((p) => p.test(url))) {
      return rule.vendor;
    }
  }
  return null;
}

// ── Helpers ────────────────────────────────────────────────────────

function buildHeaders(accessToken?: string) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

async function readErrorBody(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const json = await res.json();
      return JSON.stringify(json);
    }
    return await res.text();
  } catch {
    return "";
  }
}

// ── Scrape link ────────────────────────────────────────────────────

export async function scrapeLink(
  vendor: VendorSource,
  link: string,
  accessToken?: string
): Promise<HmScrapeResponse | PinterestScrapeResponse | ZalandoScrapeResponse> {
  if (!accessToken) {
    throw new Error("accessToken is required");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCRAPER_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${SCRAPER_ENDPOINT}/${vendor}`, {
      method: "POST",
      headers: buildHeaders(accessToken),
      body: JSON.stringify({ link }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const errBody = await readErrorBody(res);
    throw new Error(`Scraper failed (${res.status}): ${errBody}`);
  }

  return res.json();
}

// ── Map to preview data ────────────────────────────────────────────

export function mapToPreviewData(
  vendor: VendorSource,
  response: HmScrapeResponse | PinterestScrapeResponse | ZalandoScrapeResponse
): ScrapedPreviewData {
  switch (vendor) {
    case "hm": {
      const r = response as HmScrapeResponse;
      return {
        name: r.name,
        description: `Article: ${r.article_code} \u00b7 ${r.price}`,
        imageUrl: r.images?.[0] ?? "",
        images: r.images,
        tags: [...(r.colors ?? []), ...(r.sizes ?? [])],
        vendor: "hm",
      };
    }
    case "pinterest": {
      const r = response as PinterestScrapeResponse;
      return {
        name: r.post_name,
        description: [r.description, r.url].filter(Boolean).join("\n"),
        imageUrl: r.image_url,
        tags: [],
        vendor: "pinterest",
      };
    }
    case "zalando": {
      const r = response as ZalandoScrapeResponse;
      return {
        name: r.post_name,
        description: r.description,
        imageUrl: r.image_url,
        tags: [r.brand, r.category, r.color].filter(Boolean),
        vendor: "zalando",
      };
    }
  }
}
