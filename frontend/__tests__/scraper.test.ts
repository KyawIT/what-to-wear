import {
  detectVendor,
  mapToPreviewData,
  PinterestScrapeResponse,
  ZalandoScrapeResponse,
} from "@/api/backend/scraper.api";

describe("detectVendor", () => {
  it("returns null for hm.com (unsupported)", () => {
    expect(detectVendor("https://www2.hm.com/en_gb/productpage.123456.html")).toBeNull();
  });

  it("detects Zalando from zalando.at", () => {
    expect(detectVendor("https://www.zalando.at/nike-sportswear-sneaker.html")).toBe("zalando");
  });

  it("detects Zalando from zalando.de", () => {
    expect(detectVendor("https://www.zalando.de/some-product.html")).toBe("zalando");
  });

  it("detects Pinterest from pinterest.com", () => {
    expect(detectVendor("https://www.pinterest.com/pin/123456789")).toBe("pinterest");
  });

  it("detects Pinterest from pin.it short URL", () => {
    expect(detectVendor("https://pin.it/abc123")).toBe("pinterest");
  });

  it("returns null for unknown URLs", () => {
    expect(detectVendor("https://www.amazon.com/dp/B0123")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(detectVendor("")).toBeNull();
  });
});

describe("mapToPreviewData", () => {
  it("maps Pinterest response correctly", () => {
    const response: PinterestScrapeResponse = {
      pin_id: "123456",
      url: "https://www.pinterest.com/pin/123456",
      name: "A Pin",
      description: "Beautiful outfit inspiration",
      post_name: "Summer Outfit",
      image_url: "https://i.pinimg.com/originals/abc.jpg",
    };

    const result = mapToPreviewData("pinterest", response);

    expect(result.name).toBe("Summer Outfit");
    expect(result.description).toBe("Beautiful outfit inspiration\nhttps://www.pinterest.com/pin/123456");
    expect(result.imageUrl).toBe("https://i.pinimg.com/originals/abc.jpg");
    expect(result.tags).toEqual([]);
    expect(result.vendor).toBe("pinterest");
  });

  it("maps Zalando response correctly", () => {
    const response: ZalandoScrapeResponse = {
      product_id: "NI1234",
      url: "https://www.zalando.at/nike-sneaker.html",
      name: "Nike Air Max",
      description: "Comfortable running shoes",
      post_name: "NIKE Air Max 90",
      image_url: "https://img01.ztat.net/article/abc.jpg",
      brand: "Nike",
      category: "Shoes",
      color: "White",
      price: "EUR 129.99",
    };

    const result = mapToPreviewData("zalando", response);

    expect(result.name).toBe("NIKE Air Max 90");
    expect(result.description).toBe("Comfortable running shoes");
    expect(result.imageUrl).toBe("https://img01.ztat.net/article/abc.jpg");
    expect(result.tags).toEqual(["Nike", "Shoes", "White"]);
    expect(result.vendor).toBe("zalando");
  });

  it("filters out empty tags for Zalando", () => {
    const response: ZalandoScrapeResponse = {
      product_id: "XX123",
      url: "",
      name: "Test",
      description: "Test desc",
      post_name: "Test Product",
      image_url: "https://example.com/img.jpg",
      brand: "Adidas",
      category: "",
      color: "",
      price: "",
    };

    const result = mapToPreviewData("zalando", response);
    expect(result.tags).toEqual(["Adidas"]);
  });
});
