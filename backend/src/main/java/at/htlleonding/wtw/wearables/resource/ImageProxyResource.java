package at.htlleonding.wtw.wearables.resource;

import at.htlleonding.wtw.wearables.util.OutfitsUtil;
import at.htlleonding.wtw.wearables.util.WearablesUtil;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.io.InputStream;

@Path("/image")
public class ImageProxyResource {

    private static final Logger LOG = Logger.getLogger(ImageProxyResource.class);

    private final WearablesUtil wearablesUtil;
    private final OutfitsUtil outfitsUtil;

    public ImageProxyResource(WearablesUtil wearablesUtil, OutfitsUtil outfitsUtil) {
        this.wearablesUtil = wearablesUtil;
        this.outfitsUtil = outfitsUtil;
    }

    @GET
    @Path("/wearables/{objectKey:.+}")
    public Response getWearableImage(@PathParam("objectKey") String objectKey) {
        try {
            String contentType = wearablesUtil.getObjectContentType(objectKey);
            InputStream stream = wearablesUtil.getObjectStream(objectKey);
            return Response.ok(stream)
                    .header("Content-Type", contentType)
                    .header("Cache-Control", "public, max-age=86400")
                    .build();
        } catch (Exception e) {
            LOG.debugf(e, "Image not found: wearables/%s", objectKey);
            return Response.status(Response.Status.NOT_FOUND).build();
        }
    }

    @GET
    @Path("/outfits/{objectKey:.+}")
    public Response getOutfitImage(@PathParam("objectKey") String objectKey) {
        try {
            String contentType = outfitsUtil.getObjectContentType(objectKey);
            InputStream stream = outfitsUtil.getObjectStream(objectKey);
            return Response.ok(stream)
                    .header("Content-Type", contentType)
                    .header("Cache-Control", "public, max-age=86400")
                    .build();
        } catch (Exception e) {
            LOG.debugf(e, "Image not found: outfits/%s", objectKey);
            return Response.status(Response.Status.NOT_FOUND).build();
        }
    }
}
