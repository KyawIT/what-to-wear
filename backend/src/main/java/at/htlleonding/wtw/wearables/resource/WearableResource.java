package at.htlleonding.wtw.wearables.resource;

import at.htlleonding.wtw.wearables.dto.WearableCreateDto;
import at.htlleonding.wtw.wearables.dto.WearablePredictRequestDto;
import at.htlleonding.wtw.wearables.dto.WearablePredictResponseDto;
import at.htlleonding.wtw.wearables.dto.WearableResponseDto;
import at.htlleonding.wtw.wearables.dto.WearableUpdateRequestDto;
import at.htlleonding.wtw.wearables.resource.support.RequestValidation;
import at.htlleonding.wtw.wearables.security.AuthenticatedUserProvider;
import at.htlleonding.wtw.wearables.service.WearableCategoryService;
import at.htlleonding.wtw.wearables.service.WearablePredictionService;
import at.htlleonding.wtw.wearables.service.WearableService;
import io.quarkus.security.Authenticated;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.*;

import static at.htlleonding.wtw.wearables.util.WearablesUtil.parseTags;

@Path("/wearable")
@Authenticated
@Consumes(MediaType.MULTIPART_FORM_DATA)
@Produces(MediaType.APPLICATION_JSON)
public class WearableResource {

    private static final Logger LOG = Logger.getLogger(WearableResource.class);

    private final WearableService service;
    private final WearableCategoryService categoryService;
    private final WearablePredictionService predictionService;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    public WearableResource(
            WearableService service,
            WearableCategoryService categoryService,
            WearablePredictionService predictionService,
            AuthenticatedUserProvider authenticatedUserProvider
    ) {
        this.service = service;
        this.categoryService = categoryService;
        this.predictionService = predictionService;
        this.authenticatedUserProvider = authenticatedUserProvider;
    }


    @GET
    @Path("/category")
    public List<String> getAllCategory() {
        return categoryService.listByUser(requireUserId()).stream()
                .map(c -> c.name())
                .toList();
    }

    @POST
    public WearableResponseDto create(
            WearableCreateDto form
    ) {
        if (form == null) {
            throw new BadRequestException("Body is required");
        }

        List<String> tags = parseTags(form.tags);
        UUID categoryId = parseCategoryId(form.categoryId);
        String userId = requireUserId();

        try (InputStream in = Files.newInputStream(form.file.uploadedFile())) {
            return service.create(
                    userId,
                    categoryId,
                    form.title,
                    form.description,
                    tags,
                    form.file.fileName(),
                    form.file.contentType(),
                    in
            );
        } catch (BadRequestException e) {
            throw e;
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(e.getMessage());
        } catch (IOException e) {
            LOG.errorf(e, "Failed to read uploaded file for userId=%s", userId);
            throw new InternalServerErrorException("Failed to read uploaded file");
        } catch (Exception e) {
            LOG.errorf(e, "Wearable upload failed for userId=%s", userId);
            throw new InternalServerErrorException("Upload failed");
        }
    }

    @GET
    public List<WearableResponseDto> getMyWearables() {
        return service.getByUserId(requireUserId());
    }

    @GET
    @Path("/{id}")
    public WearableResponseDto getById(
            @PathParam("id") String idParam
    ) {
        UUID id = RequestValidation.parseRequiredUuid(idParam, "id");
        return service.getByWearableId(requireUserId(), id);
    }

    @DELETE
    @Path("/{id}")
    public void deleteById(
            @PathParam("id") String idParam
    ) {
        UUID id = RequestValidation.parseRequiredUuid(idParam, "id");
        service.delete(requireUserId(), id);
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    public WearableResponseDto updateById(
            @PathParam("id") String idParam,
            WearableUpdateRequestDto request
    ) {
        if (request == null) {
            throw new BadRequestException("Body is required");
        }
        if (request.title() == null || request.title().isBlank()) {
            throw new BadRequestException("title is required");
        }
        UUID id = RequestValidation.parseRequiredUuid(idParam, "id");

        UUID categoryId = parseCategoryId(request.categoryId());
        try {
            return service.update(
                    requireUserId(),
                    id,
                    categoryId,
                    request.title(),
                    request.description(),
                    request.tags()
            );
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(e.getMessage());
        }
    }

    @GET
    @Path("/by-category")
    public List<WearableResponseDto> getByCategory(
            @QueryParam("categoryId") String categoryIdParam
    ) {
        if (categoryIdParam == null || categoryIdParam.isBlank()) {
            throw new BadRequestException("categoryId query param is required");
        }

        UUID categoryId = parseCategoryId(categoryIdParam);
        return service.getByUserIdAndCategory(requireUserId(), categoryId);
    }

    @POST
    @Path("/predict")
    public WearablePredictResponseDto predict(
            WearablePredictRequestDto form
    ) {
        requireUserId();
        if (form == null || form.file == null) {
            throw new BadRequestException("file is required");
        }

        return predictionService.predict(form.file);
    }

    private static UUID parseCategoryId(String raw) {
        return RequestValidation.parseRequiredUuid(raw, "categoryId");
    }

    private String requireUserId() {
        return authenticatedUserProvider.requireUserId();
    }
}
