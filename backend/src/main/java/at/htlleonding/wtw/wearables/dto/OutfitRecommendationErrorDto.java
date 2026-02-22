package at.htlleonding.wtw.wearables.dto;

import java.util.List;
import java.util.Map;

public record OutfitRecommendationErrorDto(
        String code,
        String message,
        List<String> missingBuckets,
        Map<String, Integer> bucketCounts
) {
}
