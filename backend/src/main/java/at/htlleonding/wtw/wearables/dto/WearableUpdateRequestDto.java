package at.htlleonding.wtw.wearables.dto;

import java.util.List;

public record WearableUpdateRequestDto(
        String categoryId,
        String title,
        String description,
        List<String> tags
) {
}
