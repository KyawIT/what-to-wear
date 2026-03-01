import {
  extractCityFromWttrAutoLocation,
  normalizeCityName,
  stripCityPrefix,
} from "@/api/weather/wttr.api";

describe("wttr weather helpers", () => {
  it("strips city prefix when the city matches", () => {
    expect(stripCityPrefix("linz: 🌫  +3°C", "linz")).toBe("🌫  +3°C");
  });

  it("strips city prefix case-insensitively", () => {
    expect(stripCityPrefix("YANGON: ☀️ +26°C", "yangon")).toBe("☀️ +26°C");
  });

  it("keeps full line when prefix does not match city", () => {
    expect(stripCityPrefix("mandalay: ☀️ +28°C", "linz")).toBe("mandalay: ☀️ +28°C");
  });

  it("normalizes city names", () => {
    expect(normalizeCityName("  neW   york ")).toBe("New York");
  });

  it("extracts city from wttr auto-location payload", () => {
    const payload = {
      nearest_area: [
        {
          areaName: [{ value: "mandalay" }],
        },
      ],
    };

    expect(extractCityFromWttrAutoLocation(payload)).toBe("Mandalay");
  });

  it("returns null when wttr auto-location payload is malformed", () => {
    expect(extractCityFromWttrAutoLocation({})).toBeNull();
    expect(extractCityFromWttrAutoLocation({ nearest_area: [] })).toBeNull();
    expect(extractCityFromWttrAutoLocation(null)).toBeNull();
  });
});
