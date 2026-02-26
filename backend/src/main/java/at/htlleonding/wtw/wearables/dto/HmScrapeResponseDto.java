package at.htlleonding.wtw.wearables.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record HmScrapeResponseDto(
        String name,
        @JsonProperty("article_code") String articleCode,
        String price,
        List<String> colors,
        List<String> sizes,
        List<String> images
) {
}
