package at.htlleonding.wtw.wearables.dto;

import java.util.List;

public record WearablePredictResponseDto(
        String category,
        List<String> tags,
        double confidence
) {}
