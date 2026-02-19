package at.htlleonding.wtw.wearables.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record WearableResponseDto(
        UUID id,
        String userId,
        UUID categoryId,
        String categoryName,
        String title,
        String description,
        List<String> tags,
        String cutoutImageKey,
        String cutoutImageUrl,
        Instant createdAt,
        Instant updatedAt
) {}
