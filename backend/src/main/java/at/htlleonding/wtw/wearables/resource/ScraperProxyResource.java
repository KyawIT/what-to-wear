package at.htlleonding.wtw.wearables.resource;

import at.htlleonding.wtw.wearables.dto.HmScrapeResponseDto;
import at.htlleonding.wtw.wearables.dto.PinterestScrapeResponseDto;
import at.htlleonding.wtw.wearables.dto.ScraperLinkRequestDto;
import at.htlleonding.wtw.wearables.dto.ZalandoScrapeResponseDto;
import at.htlleonding.wtw.wearables.resource.support.RequestValidation;
import at.htlleonding.wtw.wearables.security.AuthenticatedUserProvider;
import at.htlleonding.wtw.wearables.service.ScraperProxyService;
import io.quarkus.security.Authenticated;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.net.URI;
import java.util.Locale;
import java.util.function.Predicate;

@Path("/wearableai/scraper")
@Authenticated
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ScraperProxyResource {

    private final ScraperProxyService scraperProxyService;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    public ScraperProxyResource(
            ScraperProxyService scraperProxyService,
            AuthenticatedUserProvider authenticatedUserProvider
    ) {
        this.scraperProxyService = scraperProxyService;
        this.authenticatedUserProvider = authenticatedUserProvider;
    }

    @POST
    @Path("/hm")
    public HmScrapeResponseDto scrapeHm(ScraperLinkRequestDto request) {
        requireUserId();
        String link = requireLink(request);
        URI uri = parseHttpUri(link);
        requireHost(uri, host -> host.equals("hm.com") || host.endsWith(".hm.com"), "Invalid H&M link");
        return scraperProxyService.scrapeHm(link);
    }

    @POST
    @Path("/pinterest")
    public PinterestScrapeResponseDto scrapePinterest(ScraperLinkRequestDto request) {
        requireUserId();
        String link = requireLink(request);
        URI uri = parseHttpUri(link);
        requireHost(
                uri,
                host -> host.equals("pinterest.com") || host.endsWith(".pinterest.com") || host.equals("pin.it"),
                "Invalid Pinterest link"
        );
        return scraperProxyService.scrapePinterest(link);
    }

    @POST
    @Path("/zalando")
    public ZalandoScrapeResponseDto scrapeZalando(ScraperLinkRequestDto request) {
        requireUserId();
        String link = requireLink(request);
        URI uri = parseHttpUri(link);
        requireHost(uri, host -> host.contains("zalando."), "Invalid Zalando link");
        return scraperProxyService.scrapeZalando(link);
    }

    private static String requireLink(ScraperLinkRequestDto request) {
        if (request == null) {
            throw new BadRequestException("Body is required");
        }
        return RequestValidation.requireNonBlank(request.link(), "link");
    }

    private static URI parseHttpUri(String link) {
        try {
            URI uri = URI.create(link);
            if (!uri.isAbsolute()) {
                throw new BadRequestException("Invalid link");
            }

            String scheme = uri.getScheme();
            if (scheme == null
                    || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                throw new BadRequestException("Invalid link");
            }

            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                throw new BadRequestException("Invalid link");
            }

            return uri;
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid link");
        }
    }

    private static void requireHost(URI uri, Predicate<String> matcher, String errorMessage) {
        String host = uri.getHost().toLowerCase(Locale.ROOT);
        if (!matcher.test(host)) {
            throw new BadRequestException(errorMessage);
        }
    }

    private String requireUserId() {
        return authenticatedUserProvider.requireUserId();
    }
}
