package at.htlleonding.wtw.wearables.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PinterestScrapeResponseDto(
        @JsonProperty("pin_id") String pinId,
        String url,
        String name,
        String description,
        @JsonProperty("post_name") String postName,
        @JsonProperty("image_url") String imageUrl
) {
}
