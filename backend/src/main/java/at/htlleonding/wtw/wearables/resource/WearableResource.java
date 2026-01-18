package at.htlleonding.wtw.wearables.resource;

import at.htlleonding.wtw.wearables.dto.WearableCreateDto;
import at.htlleonding.wtw.wearables.dto.WearableResponseDto;
import at.htlleonding.wtw.wearables.model.Wearable;
import at.htlleonding.wtw.wearables.model.WearableCategory;
import at.htlleonding.wtw.wearables.service.WearableService;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.io.InputStream;
import java.nio.file.Files;
import java.util.*;

import static at.htlleonding.wtw.wearables.util.WearablesUtil.*;

@Path("/wearable")
@Consumes(MediaType.MULTIPART_FORM_DATA)
@Produces(MediaType.APPLICATION_JSON)
public class WearableResource {

    private final WearableService service;

    public WearableResource(WearableService service) {
        this.service = service;
    }


    @GET
    @Path("/category")
    public List<String> getAllCategory() {
        return Arrays.stream(WearableCategory.values())
                .map(Enum::name)
                .toList();
    }

    @POST
    public Wearable create(
            @HeaderParam("X-User-Id") String userIdHeader,
            WearableCreateDto form
    ) {
        if (form == null) {
            throw new BadRequestException("Body is required");
        }

        WearableCategory category = parseCategory(form.category);
        List<String> tags = parseTags(form.tags);

        try (InputStream in = Files.newInputStream(form.file.uploadedFile())) {
            return service.create(
                    userIdHeader,
                    category,
                    form.title,
                    form.description,
                    tags,
                    form.file.fileName(),
                    form.file.contentType(),
                    in
            );
        } catch (Exception e) {
            System.out.println(e.getMessage());
            throw new InternalServerErrorException("Upload failed");
        }
    }

    @GET
    public List<WearableResponseDto> getMyWearables(
            @HeaderParam("X-User-Id") String userId
    ) {
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("Missing X-User-Id header");
        }

        return service.getByUserId(userId.trim());
    }

    @GET
    @Path("/{id}")
    public WearableResponseDto getById(
            @HeaderParam("X-User-Id") String userId,
            @PathParam("id") String idParam
    ) {
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("Missing X-User-Id header");
        }
        if (idParam == null || idParam.isBlank()) {
            throw new BadRequestException("id path param is required");
        }

        UUID id;
        try {
            id = UUID.fromString(idParam.trim());
        } catch (Exception e) {
            throw new BadRequestException("Invalid id");
        }

        return service.getByWearableId(id);
    }

    @GET
    @Path("/by-category")
    public List<WearableResponseDto> getByCategory(
            @HeaderParam("X-User-Id") String userId,
            @QueryParam("category") String categoryParam
    ) {
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("Missing X-User-Id header");
        }
        if (categoryParam == null || categoryParam.isBlank()) {
            throw new BadRequestException("category query param is required");
        }

        WearableCategory category;
        try {
            category = WearableCategory.valueOf(categoryParam.trim().toUpperCase());
        } catch (Exception e) {
            throw new BadRequestException("Invalid category");
        }

        return service.getByUserIdAndCategory(userId.trim(), category);
    }
}
