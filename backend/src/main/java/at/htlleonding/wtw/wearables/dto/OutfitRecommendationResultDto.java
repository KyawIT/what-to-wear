package at.htlleonding.wtw.wearables.dto;

import java.util.List;

public record OutfitRecommendationResultDto(
        String id,
        List<OutfitRecommendationWearableDto> wearables
) {
}
