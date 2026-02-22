package at.htlleonding.wtw.wearables.dto;

import java.util.List;
import java.util.UUID;

public record OutfitRecommendationWearableDto(
        UUID id,
        UUID categoryId,
        String categoryName,
        String title,
        List<String> tags,
        String cutoutImageUrl
) {
}
