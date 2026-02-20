package at.htlleonding.wtw.wearables.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OutfitResponseDto(
        UUID id,
        String userId,
        String title,
        String description,
        List<String> tags,
        String imageKey,
        String imageUrl,
        List<WearableResponseDto> wearables,
        Instant createdAt,
        Instant updatedAt) {
}
