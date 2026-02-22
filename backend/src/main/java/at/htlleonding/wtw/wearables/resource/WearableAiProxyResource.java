package at.htlleonding.wtw.wearables.resource;

import at.htlleonding.wtw.wearables.dto.WearableAiOutfitAiRequestDto;
import at.htlleonding.wtw.wearables.dto.WearableAiWearableDeleteRequestDto;
import at.htlleonding.wtw.wearables.dto.WearableAiWearableUploadRequestDto;
import at.htlleonding.wtw.wearables.dto.WearableAiWearableUpdateRequestDto;
import at.htlleonding.wtw.wearables.service.WearableAiProxyService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.security.Authenticated;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.hc.client5.http.entity.mime.MultipartEntityBuilder;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Path("/wearableai")
@Authenticated
@Produces(MediaType.WILDCARD)
public class WearableAiProxyResource {

    private final WearableAiProxyService proxyService;
    private final ObjectMapper objectMapper;
    private final JsonWebToken jwt;

    public WearableAiProxyResource(
            WearableAiProxyService proxyService,
            ObjectMapper objectMapper,
            JsonWebToken jwt
    ) {
        this.proxyService = proxyService;
        this.objectMapper = objectMapper;
        this.jwt = jwt;
    }

    @GET
    public Response root() {
        requireUserId();
        return proxyService.get("/");
    }

    @GET
    @Path("/health")
    public Response health() {
        requireUserId();
        return proxyService.get("/health");
    }

    @POST
    @Path("/wearables/predict")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response predict(WearableAiWearableUploadRequestDto form) {
        requireUserId();
        if (form == null || form.file == null) {
            throw new BadRequestException("file is required");
        }

        proxyService.validateImageUpload(form.file, "file");
        MultipartEntityBuilder builder = MultipartEntityBuilder.create();
        proxyService.addImagePart(builder, "file", form.file);
        return proxyService.postMultipart("/wearables/predict", builder);
    }

    @POST
    @Path("/wearables/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadWearable(WearableAiWearableUploadRequestDto form) {
        String userId = requireUserId();
        if (form == null) {
            throw new BadRequestException("Body is required");
        }
        if (form.file == null) {
            throw new BadRequestException("file is required");
        }
        if (form.category == null || form.category.isBlank()) {
            throw new BadRequestException("category is required");
        }
        if (form.tags == null || form.tags.isBlank()) {
            throw new BadRequestException("tags is required");
        }
        if (form.itemId == null || form.itemId.isBlank()) {
            throw new BadRequestException("item_id is required");
        }
        if (form.userId != null && !form.userId.isBlank() && !form.userId.equals(userId)) {
            throw new BadRequestException("user_id must match authenticated user");
        }

        proxyService.validateImageUpload(form.file, "file");
        MultipartEntityBuilder builder = MultipartEntityBuilder.create();
        proxyService.addImagePart(builder, "file", form.file);
        builder.addTextBody("category", form.category);
        builder.addTextBody("tags", form.tags);
        builder.addTextBody("item_id", form.itemId);
        builder.addTextBody("user_id", userId);
        return proxyService.postMultipart("/wearables/upload", builder);
    }

    @PUT
    @Path("/wearables/update")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response updateWearable(WearableAiWearableUpdateRequestDto request) {
        String userId = requireUserId();
        if (request == null) {
            throw new BadRequestException("Body is required");
        }
        if (request.item_id == null || request.item_id.isBlank()) {
            throw new BadRequestException("item_id is required");
        }
        if (request.category == null || request.category.isBlank()) {
            throw new BadRequestException("category is required");
        }
        if (request.tags == null || request.tags.isBlank()) {
            throw new BadRequestException("tags is required");
        }
        if (request.user_id != null && !request.user_id.isBlank() && !request.user_id.equals(userId)) {
            throw new BadRequestException("user_id must match authenticated user");
        }

        WearableAiWearableUpdateRequestDto body = new WearableAiWearableUpdateRequestDto();
        body.user_id = userId;
        body.item_id = request.item_id;
        body.category = request.category;
        body.tags = request.tags;
        return proxyService.putJson("/wearables/update", toJson(body));
    }

    @DELETE
    @Path("/wearables/delete")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response deleteWearable(WearableAiWearableDeleteRequestDto request) {
        String userId = requireUserId();
        if (request == null) {
            throw new BadRequestException("Body is required");
        }
        if (request.item_id == null || request.item_id.isBlank()) {
            throw new BadRequestException("item_id is required");
        }
        if (request.user_id != null && !request.user_id.isBlank() && !request.user_id.equals(userId)) {
            throw new BadRequestException("user_id must match authenticated user");
        }

        WearableAiWearableDeleteRequestDto body = new WearableAiWearableDeleteRequestDto();
        body.user_id = userId;
        body.item_id = request.item_id;
        return proxyService.deleteJson("/wearables/delete", toJson(body));
    }

    @POST
    @Path("/outfit/generate_outfits_simple")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response generateOutfitsSimple(String requestBody) {
        requireUserId();
        return proxyService.postJson("/outfit/generate_outfits_simple", requestBody);
    }

    @POST
    @Path("/outfit/generate_outfits")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response generateOutfits(
            @HeaderParam("Content-Type") String contentType,
            byte[] requestBody
    ) {
        requireUserId();
        return proxyService.postRaw("/outfit/generate_outfits", contentType, requestBody);
    }

    @POST
    @Path("/outfit/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadOutfit(
            @HeaderParam("Content-Type") String contentType,
            byte[] requestBody
    ) {
        requireUserId();
        return proxyService.postRaw("/outfit/upload", contentType, requestBody);
    }

    @POST
    @Path("/outfit/ai")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response aiOutfit(WearableAiOutfitAiRequestDto form) {
        String userId = requireUserId();
        if (form == null || form.image == null) {
            throw new BadRequestException("image is required");
        }
        if (form.userId != null && !form.userId.isBlank() && !form.userId.equals(userId)) {
            throw new BadRequestException("user_id must match authenticated user");
        }

        proxyService.validateImageUpload(form.image, "image");
        MultipartEntityBuilder builder = MultipartEntityBuilder.create();
        proxyService.addImagePart(builder, "image", form.image);
        builder.addTextBody("user_id", userId);
        return proxyService.postMultipart("/outfit/ai", builder);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new WebApplicationException(
                    Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                            .type(MediaType.TEXT_PLAIN)
                            .entity("Failed to serialize request")
                            .build()
            );
        }
    }

    private String requireUserId() {
        String sub = jwt.getSubject();
        if (sub == null || sub.isBlank()) {
            throw new jakarta.ws.rs.NotAuthorizedException("Missing sub claim");
        }
        return sub.trim();
    }
}
