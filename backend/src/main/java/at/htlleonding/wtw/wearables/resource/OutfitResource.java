package at.htlleonding.wtw.wearables.resource;

import at.htlleonding.wtw.wearables.dto.OutfitCreateDto;
import at.htlleonding.wtw.wearables.dto.OutfitResponseDto;
import at.htlleonding.wtw.wearables.service.OutfitService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.io.InputStream;
import java.nio.file.Files;
import java.util.List;
import java.util.UUID;

import static at.htlleonding.wtw.wearables.util.OutfitsUtil.*;

@Path("/outfit")
@Authenticated
@Consumes(MediaType.MULTIPART_FORM_DATA)
@Produces(MediaType.APPLICATION_JSON)
public class OutfitResource {

    private final OutfitService service;

    @Inject
    JsonWebToken jwt;

    public OutfitResource(OutfitService service) {
        this.service = service;
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

    private String requireUserId() {
        String sub = jwt.getSubject();
        if (sub == null || sub.isBlank()) {
            throw new NotAuthorizedException("Missing sub claim");
        }
        return sub.trim();
    }
}
