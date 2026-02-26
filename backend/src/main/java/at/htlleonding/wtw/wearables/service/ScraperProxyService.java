package at.htlleonding.wtw.wearables.service;

import at.htlleonding.wtw.wearables.dto.HmScrapeResponseDto;
import at.htlleonding.wtw.wearables.dto.PinterestScrapeResponseDto;
import at.htlleonding.wtw.wearables.dto.ZalandoScrapeResponseDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.InternalServerErrorException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.classic.methods.HttpUriRequestBase;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.HttpEntity;
import org.apache.hc.core5.http.HttpHeaders;
import org.apache.hc.core5.util.Timeout;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@ApplicationScoped
public class ScraperProxyService {

    private final ObjectMapper objectMapper;
    private final CloseableHttpClient httpClient;
    private final String hmBaseUrl;
    private final String pinterestBaseUrl;
    private final String zalandoBaseUrl;

    public ScraperProxyService(
            ObjectMapper objectMapper,
            @ConfigProperty(name = "app.scraper.hm.base-url", defaultValue = "http://wtw-hm-scraper:4523")
            String hmBaseUrl,
            @ConfigProperty(name = "app.scraper.pinterest.base-url", defaultValue = "http://wtw-pinterest-scraper:4524")
            String pinterestBaseUrl,
            @ConfigProperty(name = "app.scraper.zalando.base-url", defaultValue = "http://wtw-zalando-scraper:4525")
            String zalandoBaseUrl
    ) {
        this.objectMapper = objectMapper;
        this.hmBaseUrl = trimTrailingSlash(hmBaseUrl);
        this.pinterestBaseUrl = trimTrailingSlash(pinterestBaseUrl);
        this.zalandoBaseUrl = trimTrailingSlash(zalandoBaseUrl);

        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectionRequestTimeout(Timeout.ofSeconds(5))
                .setConnectTimeout(Timeout.ofSeconds(5))
                .setResponseTimeout(Timeout.ofSeconds(45))
                .build();

        this.httpClient = HttpClients.custom()
                .setDefaultRequestConfig(requestConfig)
                .build();
    }

    public HmScrapeResponseDto scrapeHm(String link) {
        return scrape(hmBaseUrl, link, HmScrapeResponseDto.class, "H&M scraper");
    }

    public PinterestScrapeResponseDto scrapePinterest(String link) {
        return scrape(pinterestBaseUrl, link, PinterestScrapeResponseDto.class, "Pinterest scraper");
    }

    public ZalandoScrapeResponseDto scrapeZalando(String link) {
        return scrape(zalandoBaseUrl, link, ZalandoScrapeResponseDto.class, "Zalando scraper");
    }

    private <T> T scrape(String baseUrl, String link, Class<T> responseType, String upstreamName) {
        HttpGet request = new HttpGet(buildScrapeUrl(baseUrl, link));
        request.setHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON);
        return execute(request, responseType, upstreamName);
    }

    private <T> T execute(HttpUriRequestBase request, Class<T> responseType, String upstreamName) {
        try (CloseableHttpResponse response = httpClient.execute(request)) {
            int status = response.getCode();
            HttpEntity entity = response.getEntity();
            String body = entity != null
                    ? new String(entity.getContent().readAllBytes(), StandardCharsets.UTF_8)
                    : "";

            if (status >= 200 && status < 300) {
                if (body == null || body.isBlank()) {
                    throw new WebApplicationException(
                            Response.status(Response.Status.BAD_GATEWAY)
                                    .type(MediaType.TEXT_PLAIN)
                                    .entity(upstreamName + " returned an empty response")
                                    .build()
                    );
                }
                return objectMapper.readValue(body, responseType);
            }

            if (status >= 400 && status < 500) {
                throw new WebApplicationException(
                        Response.status(status)
                                .type(MediaType.TEXT_PLAIN)
                                .entity(extractErrorMessage(body, "Invalid scrape request"))
                                .build()
                );
            }

            throw new WebApplicationException(
                    Response.status(Response.Status.BAD_GATEWAY)
                            .type(MediaType.TEXT_PLAIN)
                            .entity(upstreamName + " error (" + status + "): "
                                    + extractErrorMessage(body, "Upstream service error"))
                            .build()
            );
        } catch (WebApplicationException e) {
            throw e;
        } catch (IOException e) {
            throw new InternalServerErrorException("Failed to process scraper response", e);
        } catch (Exception e) {
            throw new WebApplicationException(
                    Response.status(Response.Status.SERVICE_UNAVAILABLE)
                            .type(MediaType.TEXT_PLAIN)
                            .entity(upstreamName + " unavailable")
                            .build()
            );
        }
    }

    private String extractErrorMessage(String body, String fallback) {
        if (body == null || body.isBlank()) {
            return fallback;
        }

        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode errorNode = root.get("error");
            if (errorNode != null && errorNode.isTextual()) {
                String message = errorNode.asText();
                if (message != null && !message.isBlank()) {
                    return message;
                }
            }
        } catch (Exception ignored) {
            // Fall through and return raw response body for non-JSON errors.
        }

        return body;
    }

    private static String buildScrapeUrl(String baseUrl, String link) {
        String encodedLink = URLEncoder.encode(link, StandardCharsets.UTF_8);
        return baseUrl + "/scrape?url=" + encodedLink;
    }

    private static String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String trimmed = value.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }
}
