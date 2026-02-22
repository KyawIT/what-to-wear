package at.htlleonding.wtw.wearables.dto;

import java.util.List;

public record OutfitRecommendationResponseDto(
        List<OutfitRecommendationResultDto> outfits,
        List<String> warnings
) {
}
