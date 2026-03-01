const WTTR_BASE_URL = "https://wttr.in";

type WttrAreaName = {
  value?: string;
};

type WttrNearestArea = {
  areaName?: WttrAreaName[];
};

type WttrAutoLocationPayload = {
  nearest_area?: WttrNearestArea[];
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeCityName(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((chunk) => {
      if (!chunk) return chunk;
      return chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase();
    })
    .join(" ");
}

export function stripCityPrefix(line: string, city: string): string {
  const cleanLine = line.trim();
  const cleanCity = city.trim();

  if (!cleanLine || !cleanCity) {
    return cleanLine;
  }

  const directPrefixRegex = new RegExp(`^${escapeRegExp(cleanCity)}\\s*:\\s*`, "i");
  if (directPrefixRegex.test(cleanLine)) {
    return cleanLine.replace(directPrefixRegex, "").trim();
  }

  const colonIndex = cleanLine.indexOf(":");
  if (colonIndex < 0) {
    return cleanLine;
  }

  const prefix = cleanLine.slice(0, colonIndex);
  if (normalizeCityName(prefix) === normalizeCityName(cleanCity)) {
    return cleanLine.slice(colonIndex + 1).trim();
  }

  return cleanLine;
}

export function extractCityFromWttrAutoLocation(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as WttrAutoLocationPayload;
  const cityCandidate = data.nearest_area?.[0]?.areaName?.[0]?.value;

  if (!isNonEmptyString(cityCandidate)) {
    return null;
  }

  return normalizeCityName(cityCandidate);
}

export async function fetchWttrLine(city: string): Promise<string> {
  const normalizedCity = normalizeCityName(city);
  if (!normalizedCity) {
    throw new Error("city is required");
  }

  const response = await fetch(
    `${WTTR_BASE_URL}/${encodeURIComponent(normalizedCity)}?format=3`,
    {
      method: "GET",
      headers: {
        Accept: "text/plain",
      },
    }
  );

  if (!response.ok) {
    const text = (await response.text()).trim();
    throw new Error(`Failed to fetch weather (${response.status}): ${text}`);
  }

  const line = (await response.text()).trim();
  if (!line) {
    throw new Error("Empty weather response from wttr.in");
  }

  return line;
}

export async function fetchAutoLocationFromWttr(): Promise<{ city: string | null }> {
  const response = await fetch(`${WTTR_BASE_URL}/?format=j1`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = (await response.text()).trim();
    throw new Error(`Failed to auto-detect location (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as unknown;
  return {
    city: extractCityFromWttrAutoLocation(payload),
  };
}
