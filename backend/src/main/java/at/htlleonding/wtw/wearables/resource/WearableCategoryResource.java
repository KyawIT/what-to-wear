package at.htlleonding.wtw.wearables.resource;

import at.htlleonding.wtw.wearables.dto.WearableCategoryResponseDto;
import at.htlleonding.wtw.wearables.dto.WearableCategoryRequestDto;
import at.htlleonding.wtw.wearables.resource.support.RequestValidation;
import at.htlleonding.wtw.wearables.security.AuthenticatedUserProvider;
import at.htlleonding.wtw.wearables.service.WearableCategoryService;
import io.quarkus.security.Authenticated;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.UUID;

@Path("/wearable-category")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
public class WearableCategoryResource {
    private final WearableCategoryService service;
    private final AuthenticatedUserProvider authenticatedUserProvider;

    public WearableCategoryResource(
            WearableCategoryService service,
            AuthenticatedUserProvider authenticatedUserProvider
    ) {
        this.service = service;
        this.authenticatedUserProvider = authenticatedUserProvider;
    }

    @POST
    public WearableCategoryResponseDto create(
            WearableCategoryRequestDto body
    ) {
        return service.create(requireUserId(), body);
    }

    @GET
    public List<WearableCategoryResponseDto> list() {
        return service.listByUser(requireUserId());
    }

    @GET
    @Path("/{id}")
    public WearableCategoryResponseDto getById(
            @PathParam("id") String idParam
    ) {
        return service.getById(requireUserId(), parseId(idParam));
    }

    @PUT
    @Path("/{id}")
    public WearableCategoryResponseDto update(
            @PathParam("id") String idParam,
            WearableCategoryRequestDto body
    ) {
        return service.update(requireUserId(), parseId(idParam), body);
    }

    @DELETE
    @Path("/{id}")
    public void delete(
            @PathParam("id") String idParam
    ) {
        service.delete(requireUserId(), parseId(idParam));
    }

    private static UUID parseId(String raw) {
        return RequestValidation.parseRequiredUuid(raw, "id");
    }

    private String requireUserId() {
        return authenticatedUserProvider.requireUserId();
    }
}
