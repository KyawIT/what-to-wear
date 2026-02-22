package at.htlleonding.wtw.wearables.resource;

import at.htlleonding.wtw.wearables.dto.OutfitCreateDto;
import at.htlleonding.wtw.wearables.dto.OutfitRecommendationResponseDto;
import at.htlleonding.wtw.wearables.dto.OutfitResponseDto;
import at.htlleonding.wtw.wearables.dto.OutfitUpdateRequestDto;
import at.htlleonding.wtw.wearables.service.OutfitRecommendationService;
import at.htlleonding.wtw.wearables.service.OutfitService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.resteasy.reactive.server.multipart.MultipartFormDataInput;

import java.io.InputStream;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static at.htlleonding.wtw.wearables.util.OutfitsUtil.*;

@Path("/outfit")
@Authenticated
@Consumes(MediaType.MULTIPART_FORM_DATA)
@Produces(MediaType.APPLICATION_JSON)
public class OutfitResource {

    private final OutfitService service;
    private final OutfitRecommendationService recommendationService;

    @Inject
    JsonWebToken jwt;

    public OutfitResource(OutfitService service, OutfitRecommendationService recommendationService) {
        this.service = service;
        this.recommendationService = recommendationService;
    }

    @POST
    public OutfitResponseDto create(OutfitCreateDto form) {
        if (form == null) {
            throw new BadRequestException("Body is required");
        }
        if (form.title == null || form.title.isBlank()) {
            throw new BadRequestException("title is required");
        }

        String userId = requireUserId();
        List<String> tags = parseTags(form.tags);
        List<UUID> wearableIds = parseUuidList(form.wearableIds);

        if (form.file != null) {
            try (InputStream in = Files.newInputStream(form.file.uploadedFile())) {
                return service.create(
                        userId,
                        form.title,
                        form.description,
                        tags,
                        wearableIds,
                        form.file.fileName(),
                        form.file.contentType(),
                        in);
            } catch (BadRequestException | IllegalArgumentException e) {
                throw e;
            } catch (Exception e) {
                System.out.println(e.getMessage());
                throw new InternalServerErrorException("Upload failed");
            }
        } else {
            return service.create(
                    userId,
                    form.title,
                    form.description,
                    tags,
                    wearableIds,
                    null,
                    null,
                    null);
        }
    }

    @GET
    public List<OutfitResponseDto> getMyOutfits() {
        return service.getByUserId(requireUserId());
    }

    @GET
    @Path("/{id}")
    public OutfitResponseDto getById(@PathParam("id") String idParam) {
        if (idParam == null || idParam.isBlank()) {
            throw new BadRequestException("id path param is required");
        }

        UUID id;
        try {
            id = UUID.fromString(idParam.trim());
        } catch (Exception e) {
            throw new BadRequestException("Invalid id");
        }

        return service.getById(requireUserId(), id);
    }

    @DELETE
    @Path("/{id}")
    public void delete(@PathParam("id") String idParam) {
        if (idParam == null || idParam.isBlank()) {
            throw new BadRequestException("id path param is required");
        }

        UUID id;
        try {
            id = UUID.fromString(idParam.trim());
        } catch (Exception e) {
            throw new BadRequestException("Invalid id");
        }

        service.delete(requireUserId(), id);
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    public OutfitResponseDto updateById(
            @PathParam("id") String idParam,
            OutfitUpdateRequestDto request
    ) {
        if (idParam == null || idParam.isBlank()) {
            throw new BadRequestException("id path param is required");
        }
        if (request == null) {
            throw new BadRequestException("Body is required");
        }
        if (request.title() == null || request.title().isBlank()) {
            throw new BadRequestException("title is required");
        }

        UUID outfitId;
        try {
            outfitId = UUID.fromString(idParam.trim());
        } catch (Exception e) {
            throw new BadRequestException("Invalid id");
        }

        List<UUID> wearableIds = parseWearableIds(request.wearableIds());
        try {
            return service.update(
                    requireUserId(),
                    outfitId,
                    request.title(),
                    request.description(),
                    request.tags(),
                    wearableIds
            );
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(e.getMessage());
        }
    }

    @POST
    @Path("/recommend-from-uploads")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public OutfitRecommendationResponseDto recommendFromUploads(MultipartFormDataInput input) {
        return recommendationService.recommendFromUploads(requireUserId(), input);
    }

    private static List<UUID> parseWearableIds(List<String> wearableIds) {
        if (wearableIds == null) {
            return List.of();
        }

        List<UUID> out = new ArrayList<>();
        for (String id : wearableIds) {
            if (id == null || id.isBlank()) {
                continue;
            }
            try {
                out.add(UUID.fromString(id.trim()));
            } catch (Exception e) {
                throw new BadRequestException("Invalid wearable id: " + id);
            }
        }
        return out;
    }

    private String requireUserId() {
        String sub = jwt.getSubject();
        if (sub == null || sub.isBlank()) {
            throw new NotAuthorizedException("Missing sub claim");
        }
        return sub.trim();
    }
}
