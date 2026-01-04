package at.htlleonding.wtw.wearables.dto;
import at.htlleonding.wtw.wearables.model.WearableCategory;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
public class WearableResponseDto {
    public UUID id;
    public String userId;
    public WearableCategory category;
    public String title;
    public String description;
    public List<String> tags;

    public String cutoutImageKey;
    public String cutoutImageUrl;

    public Instant createdAt;
    public Instant updatedAt;
}
