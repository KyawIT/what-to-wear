package at.htlleonding.wtw.wearables.dto;

import java.util.List;

public record OutfitUpdateRequestDto(
        String title,
        String description,
        List<String> tags,
        List<String> wearableIds
) {
}
