package at.htlleonding.wtw.wearables.service;

import at.htlleonding.wtw.wearables.dto.WearableAiWearableUpdateRequestDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@ApplicationScoped
public class WearableAiWearableSyncService {

    private static final Logger LOG = Logger.getLogger(WearableAiWearableSyncService.class);

    private final WearableAiProxyService proxyService;
    private final ObjectMapper objectMapper;

    public WearableAiWearableSyncService(
            WearableAiProxyService proxyService,
            ObjectMapper objectMapper
    ) {
        this.proxyService = proxyService;
        this.objectMapper = objectMapper;
    }

    public void syncWearableUpdateAsync(
            String userId,
            UUID wearableId,
            String category,
            List<String> tags
    ) {
        if (userId == null || userId.isBlank() || wearableId == null || category == null || category.isBlank()) {
            return;
        }

        CompletableFuture.runAsync(() -> syncWearableUpdate(userId.trim(), wearableId, category.trim(), tags));
    }

    private void syncWearableUpdate(
            String userId,
            UUID wearableId,
            String category,
            List<String> tags
    ) {
        Response response = null;
        try {
            WearableAiWearableUpdateRequestDto body = new WearableAiWearableUpdateRequestDto();
            body.user_id = userId;
            body.item_id = wearableId.toString();
            body.category = category;
            body.tags = String.join(",", tags == null ? List.of() : tags);

            response = proxyService.putJson("/wearables/update", objectMapper.writeValueAsString(body));
            int status = response.getStatus();
            if (status >= 400) {
                LOG.warnf(
                        "Python wearable sync failed with status=%d userId=%s wearableId=%s",
                        status, userId, wearableId
                );
            }
        } catch (Exception e) {
            LOG.warnf(
                    e,
                    "Python wearable sync failed userId=%s wearableId=%s",
                    userId, wearableId
            );
        } finally {
            if (response != null) {
                response.close();
            }
        }
    }
}
