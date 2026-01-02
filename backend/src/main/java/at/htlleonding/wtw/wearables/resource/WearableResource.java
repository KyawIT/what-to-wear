package at.htlleonding.wtw.wearables.resource;

import at.htlleonding.wtw.wearables.dto.WearableCreateDto;
import at.htlleonding.wtw.wearables.model.Wearable;
import at.htlleonding.wtw.wearables.model.WearableCategory;
import at.htlleonding.wtw.wearables.service.WearableService;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.jspecify.annotations.NonNull;

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
        UUID userId = parseUserId(userIdHeader);
        if (form == null) throw new BadRequestException("Body is required");

        WearableCategory category = parseCategory(form.category);
        List<String> tags = parseTags(form.tags);

        if (form.file == null) {
            return service.create(
                    userId,
                    category,
                    form.title,
                    form.description,
                    tags,
                    null,
                    null,
                    null
            );
        }

        try (InputStream in = Files.newInputStream(form.file.uploadedFile())) {
            return service.create(
                    userId,
                    category,
                    form.title,
                    form.description,
                    tags,
                    form.file.fileName(),
                    form.file.contentType(),
                    in
            );
        } catch (Exception e) {
            throw new InternalServerErrorException("Upload failed");
        }
    }
}
