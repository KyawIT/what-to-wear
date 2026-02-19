package at.htlleonding.wtw.wearables.dto;

import java.time.Instant;
import java.util.UUID;

public record WearableCategoryResponseDto(
        UUID id,
        String userId,
        String name,
        Instant createdAt,
        Instant updatedAt
) {}
