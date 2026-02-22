package at.htlleonding.wtw.wearables.service;

import at.htlleonding.wtw.wearables.dto.OutfitRecommendationRequestItemDto;
import at.htlleonding.wtw.wearables.dto.OutfitRecommendationErrorDto;
import at.htlleonding.wtw.wearables.dto.OutfitRecommendationResponseDto;
import at.htlleonding.wtw.wearables.dto.OutfitRecommendationResultDto;
import at.htlleonding.wtw.wearables.dto.OutfitRecommendationWearableDto;
import at.htlleonding.wtw.wearables.model.Wearable;
import at.htlleonding.wtw.wearables.repository.WearableRepository;
import at.htlleonding.wtw.wearables.util.WearablesUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.server.multipart.FormValue;
import org.jboss.resteasy.reactive.server.multipart.MultipartFormDataInput;

import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class OutfitRecommendationService {
    private static final Logger LOG = Logger.getLogger(OutfitRecommendationService.class);
    private static final int MIN_ITEMS = 5;
    private static final int DEFAULT_LIMIT = 6;
    private static final int MAX_LIMIT = 12;
    private static final int PYTHON_RETRIES = 4;

    private final WearableRepository wearableRepo;
    private final WearableAiProxyService pythonProxyService;
    private final WearablesUtil wearablesUtil;
    private final ObjectMapper objectMapper;

    public OutfitRecommendationService(
            WearableRepository wearableRepo,
            WearableAiProxyService pythonProxyService,
            WearablesUtil wearablesUtil,
            ObjectMapper objectMapper
    ) {
        this.wearableRepo = wearableRepo;
        this.pythonProxyService = pythonProxyService;
        this.wearablesUtil = wearablesUtil;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public OutfitRecommendationResponseDto recommendFromUploads(String userId, MultipartFormDataInput input) {
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("userId is required");
        }
        if (input == null || input.getValues() == null || input.getValues().isEmpty()) {
            throw new BadRequestException("Multipart body is required");
        }

        Map<String, Collection<FormValue>> values = input.getValues();
        int limitOutfits = parseLimit(values.get("limitOutfits"));
        List<OutfitRecommendationRequestItemDto> requestItems = parseItems(values.get("items"));
        if (requestItems.size() < MIN_ITEMS) {
            throw new BadRequestException("At least 5 items are required");
        }

        Map<String, FormValue> uploadedFiles = collectFileParts(values);
        Set<UUID> requestedIds = new LinkedHashSet<>();
        for (OutfitRecommendationRequestItemDto item : requestItems) {
            UUID wearableId = parseUuid(item.wearableId(), "Invalid wearableId");
            if (!requestedIds.add(wearableId)) {
                throw new BadRequestException("Duplicate wearableId in request: " + wearableId);
            }
            if (item.fileKey() == null || item.fileKey().isBlank()) {
                throw new BadRequestException("fileKey is required for wearableId " + wearableId);
            }

            FormValue filePart = uploadedFiles.get(item.fileKey());
            if (filePart == null || !filePart.isFileItem()) {
                throw new BadRequestException("Missing image for fileKey: " + item.fileKey());
            }
            validateImagePart(filePart, item.fileKey());
        }

        List<Wearable> wearables = wearableRepo
                .find("id in ?1 and userId = ?2", requestedIds, userId.trim())
                .list();

        if (wearables.size() != requestedIds.size()) {
            Set<UUID> foundIds = new HashSet<>();
            for (Wearable wearable : wearables) {
                foundIds.add(wearable.id);
            }
            List<UUID> missing = requestedIds.stream().filter(id -> !foundIds.contains(id)).toList();
            throw new BadRequestException("Wearables not found for user: " + missing);
        }

        Map<UUID, Wearable> wearablesById = new HashMap<>();
        for (Wearable wearable : wearables) {
            if (wearable.category == null || wearable.category.name == null || wearable.category.name.isBlank()) {
                throw new BadRequestException("Wearable category missing for id " + wearable.id);
            }
            wearablesById.put(wearable.id, wearable);
        }

        Map<String, Integer> bucketCounts = computeBucketCounts(wearablesById.values());
        List<String> missingBuckets = missingRequiredBuckets(bucketCounts);
        if (!missingBuckets.isEmpty()) {
            throw recommendationUnprocessable(
                    userId,
                    requestItems.size(),
                    wearablesById.values(),
                    bucketCounts,
                    missingBuckets,
                    "Could not generate outfits. Missing required categories: " + String.join(", ", missingBuckets)
            );
        }

        List<String> warnings = new ArrayList<>();
        List<List<UUID>> combinedOutfits = collectOutfitsFromPython(wearablesById, limitOutfits, warnings);
        fillOutfitsWithFallback(combinedOutfits, wearablesById, limitOutfits, warnings);

        if (combinedOutfits.isEmpty()) {
            throw recommendationUnprocessable(
                    userId,
                    requestItems.size(),
                    wearablesById.values(),
                    bucketCounts,
                    List.of(),
                    "Could not generate outfit combinations from the provided items"
            );
        }

        if (combinedOutfits.size() < limitOutfits) {
            warnings.add("Returned fewer outfits than requested because not enough distinct combinations were possible.");
        }

        List<OutfitRecommendationResultDto> results = new ArrayList<>();
        int idx = 1;
        for (List<UUID> outfitIds : combinedOutfits.stream().limit(limitOutfits).toList()) {
            List<OutfitRecommendationWearableDto> wearableDtos = new ArrayList<>();
            for (UUID outfitWearableId : outfitIds) {
                Wearable wearable = wearablesById.get(outfitWearableId);
                if (wearable == null) {
                    continue;
                }
                wearableDtos.add(new OutfitRecommendationWearableDto(
                        wearable.id,
                        wearable.category.id,
                        wearable.category.name,
                        wearable.title,
                        wearable.tags == null ? List.of() : new ArrayList<>(wearable.tags),
                        wearable.cutoutImageKey == null ? null : wearablesUtil.presignedGetUrl(wearable.cutoutImageKey, 600)
                ));
            }
            if (!wearableDtos.isEmpty()) {
                results.add(new OutfitRecommendationResultDto("outfit-" + idx, wearableDtos));
                idx++;
            }
        }

        if (results.isEmpty()) {
            throw recommendationUnprocessable(
                    userId,
                    requestItems.size(),
                    wearablesById.values(),
                    bucketCounts,
                    List.of(),
                    "Could not generate outfit combinations from the provided items"
            );
        }
        return new OutfitRecommendationResponseDto(results, warnings);
    }

    private List<List<UUID>> collectOutfitsFromPython(
            Map<UUID, Wearable> wearablesById,
            int limitOutfits,
            List<String> warnings
    ) {
        Set<String> seenKeys = new LinkedHashSet<>();
        List<List<UUID>> outfits = new ArrayList<>();
        String payload = buildPythonRequestBody(wearablesById.values(), limitOutfits);

        for (int attempt = 0; attempt < PYTHON_RETRIES && outfits.size() < limitOutfits; attempt++) {
            Response response = pythonProxyService.postJson("/outfit/generate_outfits_simple", payload);
            try {
                if (response.getStatus() < 200 || response.getStatus() >= 300) {
                    String body = responseBodyAsString(response);
                    throw new WebApplicationException(
                            Response.status(Response.Status.BAD_GATEWAY)
                                    .entity("Outfit generation upstream failed (" + response.getStatus() + "): " + body)
                                    .build()
                    );
                }

                String body = responseBodyAsString(response);
                JsonNode root = objectMapper.readTree(body);
                JsonNode rawOutfits = root.path("outfits");
                if (!rawOutfits.isArray()) {
                    continue;
                }

                for (JsonNode rawOutfit : rawOutfits) {
                    List<UUID> ids = extractOutfitIds(rawOutfit, wearablesById.keySet());
                    if (ids.isEmpty()) {
                        continue;
                    }
                    String key = toOutfitKey(ids);
                    if (seenKeys.add(key)) {
                        outfits.add(ids);
                        if (outfits.size() >= limitOutfits) {
                            break;
                        }
                    }
                }
            } catch (WebApplicationException e) {
                throw e;
            } catch (Exception e) {
                throw new WebApplicationException(
                        Response.status(Response.Status.BAD_GATEWAY)
                                .entity("Failed to parse outfit generation response")
                                .build()
                );
            } finally {
                response.close();
            }
        }

        if (outfits.size() < limitOutfits) {
            warnings.add("Python service returned fewer unique outfits than requested; applying fallback strategy.");
        }
        return outfits;
    }

    private void fillOutfitsWithFallback(
            List<List<UUID>> outfits,
            Map<UUID, Wearable> wearablesById,
            int target,
            List<String> warnings
    ) {
        Set<String> seenKeys = new LinkedHashSet<>();
        for (List<UUID> outfit : outfits) {
            seenKeys.add(toOutfitKey(outfit));
        }

        List<UUID> tops = new ArrayList<>();
        List<UUID> bottoms = new ArrayList<>();
        List<UUID> footwear = new ArrayList<>();
        List<UUID> outerwear = new ArrayList<>();
        List<UUID> accessories = new ArrayList<>();
        List<UUID> others = new ArrayList<>();

        for (Wearable wearable : wearablesById.values()) {
            String bucket = bucketFor(wearable.category.name);
            switch (bucket) {
                case "TOP" -> tops.add(wearable.id);
                case "BOTTOM" -> bottoms.add(wearable.id);
                case "FOOTWEAR" -> footwear.add(wearable.id);
                case "OUTERWEAR" -> outerwear.add(wearable.id);
                case "ACCESSORY" -> accessories.add(wearable.id);
                default -> others.add(wearable.id);
            }
        }

        int attempts = 0;
        while (outfits.size() < target && attempts < target * 30) {
            attempts++;
            if (tops.isEmpty() || bottoms.isEmpty() || footwear.isEmpty()) {
                break;
            }

            UUID shoe = footwear.get(attempts % footwear.size());
            UUID bottom = bottoms.get((attempts / Math.max(1, footwear.size())) % bottoms.size());
            UUID top = tops.get((attempts / Math.max(1, bottoms.size())) % tops.size());

            List<UUID> combo = new ArrayList<>();
            combo.add(shoe);
            combo.add(bottom);
            combo.add(top);

            if (!outerwear.isEmpty() && attempts % 2 == 0) {
                combo.add(outerwear.get(attempts % outerwear.size()));
            }
            if (!accessories.isEmpty()) {
                combo.add(accessories.get((attempts / 2) % accessories.size()));
            }
            if (!others.isEmpty() && attempts % 3 == 0) {
                combo.add(others.get(attempts % others.size()));
            }

            combo = combo.stream().distinct().toList();
            String key = toOutfitKey(combo);
            if (seenKeys.add(key)) {
                outfits.add(combo);
            }
        }

        if (outfits.size() < target && !outfits.isEmpty()) {
            int i = 0;
            while (outfits.size() < target) {
                outfits.add(new ArrayList<>(outfits.get(i % outfits.size())));
                i++;
            }
            warnings.add("Insufficient unique combinations; repeated combinations were used to satisfy the requested count.");
        }
    }

    private String buildPythonRequestBody(Collection<Wearable> wearables, int limitOutfits) {
        Map<String, Object> root = new HashMap<>();
        List<Map<String, Object>> payloadWearables = new ArrayList<>();

        for (Wearable wearable : wearables) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", wearable.id.toString());
            item.put("category", wearable.category.name);
            item.put("tags", wearable.tags == null ? List.of() : new ArrayList<>(wearable.tags));
            payloadWearables.add(item);
        }

        root.put("wearables", payloadWearables);
        root.put("limitOutfits", limitOutfits);

        try {
            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new WebApplicationException(
                    Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity("Failed to build generation payload").build()
            );
        }
    }

    private List<UUID> extractOutfitIds(JsonNode rawOutfit, Set<UUID> allowedIds) {
        List<UUID> out = new ArrayList<>();
        JsonNode refs = rawOutfit.path("wearables");
        if (!refs.isArray()) {
            refs = rawOutfit.path("items");
        }
        if (!refs.isArray()) {
            return List.of();
        }

        for (JsonNode ref : refs) {
            String idText = null;
            if (ref.isTextual()) {
                idText = ref.asText();
            } else if (ref.isObject()) {
                JsonNode idNode = ref.get("id");
                JsonNode itemIdNode = ref.get("item_id");
                if (idNode != null && idNode.isTextual()) {
                    idText = idNode.asText();
                } else if (itemIdNode != null && itemIdNode.isTextual()) {
                    idText = itemIdNode.asText();
                }
            }
            if (idText == null || idText.isBlank()) {
                continue;
            }
            try {
                UUID id = UUID.fromString(idText.trim());
                if (allowedIds.contains(id)) {
                    out.add(id);
                }
            } catch (Exception ignored) {
            }
        }

        return out.stream().distinct().toList();
    }

    private static String toOutfitKey(List<UUID> ids) {
        return ids.stream()
                .map(UUID::toString)
                .sorted()
                .reduce((a, b) -> a + "|" + b)
                .orElse("");
    }

    private static int parseLimit(Collection<FormValue> values) {
        if (values == null || values.isEmpty()) {
            return DEFAULT_LIMIT;
        }
        String raw = firstText(values);
        if (raw == null || raw.isBlank()) {
            return DEFAULT_LIMIT;
        }
        try {
            int parsed = Integer.parseInt(raw.trim());
            if (parsed < 1) return DEFAULT_LIMIT;
            return Math.min(parsed, MAX_LIMIT);
        } catch (Exception e) {
            throw new BadRequestException("limitOutfits must be an integer");
        }
    }

    private List<OutfitRecommendationRequestItemDto> parseItems(Collection<FormValue> values) {
        String rawItems = firstText(values);
        if (rawItems == null || rawItems.isBlank()) {
            throw new BadRequestException("items is required");
        }

        try {
            JsonNode node = objectMapper.readTree(rawItems);
            if (!node.isArray()) {
                throw new BadRequestException("items must be an array");
            }
            return objectMapper.readValue(rawItems, new TypeReference<>() {
            });
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("items must be valid JSON");
        }
    }

    private static Map<String, FormValue> collectFileParts(Map<String, Collection<FormValue>> values) {
        Map<String, FormValue> files = new HashMap<>();
        for (Map.Entry<String, Collection<FormValue>> entry : values.entrySet()) {
            for (FormValue value : entry.getValue()) {
                if (value != null && value.isFileItem()) {
                    files.putIfAbsent(entry.getKey(), value);
                }
            }
        }
        return files;
    }

    private static String firstText(Collection<FormValue> values) {
        if (values == null) {
            return null;
        }
        for (FormValue value : values) {
            if (value != null && !value.isFileItem()) {
                return value.getValue();
            }
        }
        return null;
    }

    private static UUID parseUuid(String raw, String message) {
        if (raw == null || raw.isBlank()) {
            throw new BadRequestException(message);
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (Exception e) {
            throw new BadRequestException(message + ": " + raw);
        }
    }

    private static void validateImagePart(FormValue formValue, String fileKey) {
        if (formValue.getFileItem() == null || formValue.getFileItem().getFile() == null) {
            throw new BadRequestException("uploaded image is missing for fileKey: " + fileKey);
        }
        if (!Files.exists(formValue.getFileItem().getFile())) {
            throw new BadRequestException("uploaded image is missing for fileKey: " + fileKey);
        }
        String contentType = extractContentType(formValue.getHeaders(), formValue.getFileName());
        if (!contentType.startsWith("image/")) {
            throw new BadRequestException("file must be an image for fileKey: " + fileKey);
        }
    }

    private static String extractContentType(MultivaluedMap<String, String> headers, String fileName) {
        if (headers != null) {
            for (Map.Entry<String, List<String>> entry : headers.entrySet()) {
                if ("content-type".equalsIgnoreCase(entry.getKey()) && entry.getValue() != null && !entry.getValue().isEmpty()) {
                    String value = entry.getValue().get(0);
                    if (value != null && !value.isBlank()) {
                        return value.trim().toLowerCase(Locale.ROOT);
                    }
                }
            }
        }
        String lower = fileName == null ? "" : fileName.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }

    private static String bucketFor(String categoryName) {
        String value = categoryName == null ? "" : categoryName.toLowerCase(Locale.ROOT);
        if (value.contains("shoe") || value.contains("sneaker") || value.contains("boot") || value.contains("footwear")
                || value.contains("trainer") || value.contains("loafer") || value.contains("heel")
                || value.contains("sandal") || value.contains("slipper")) {
            return "FOOTWEAR";
        }
        if (value.contains("pant") || value.contains("jean") || value.contains("short") || value.contains("skirt")
                || value.contains("dress") || value.contains("bottom") || value.contains("trouser")
                || value.contains("chino") || value.contains("legging")) {
            return "BOTTOM";
        }
        if (value.contains("jacket") || value.contains("coat") || value.contains("outer") || value.contains("blazer")) {
            return "OUTERWEAR";
        }
        if (value.contains("shirt") || value.contains("top") || value.contains("hoodie") || value.contains("sweater")
                || value.contains("blouse") || value.contains("tee") || value.contains("upper")) {
            return "TOP";
        }
        if (value.contains("accessor") || value.contains("belt") || value.contains("bag") || value.contains("hat")
                || value.contains("scarf") || value.contains("sock") || value.contains("jewelry")
                || value.contains("jewel") || value.contains("cap") || value.contains("glove")) {
            return "ACCESSORY";
        }
        return "OTHER";
    }

    private static Map<String, Integer> computeBucketCounts(Collection<Wearable> wearables) {
        Map<String, Integer> counts = new HashMap<>();
        counts.put("TOP", 0);
        counts.put("BOTTOM", 0);
        counts.put("FOOTWEAR", 0);
        counts.put("OUTERWEAR", 0);
        counts.put("ACCESSORY", 0);
        counts.put("OTHER", 0);

        for (Wearable wearable : wearables) {
            String bucket = bucketFor(wearable.category == null ? null : wearable.category.name);
            counts.compute(bucket, (k, v) -> v == null ? 1 : v + 1);
        }
        return counts;
    }

    private static List<String> missingRequiredBuckets(Map<String, Integer> bucketCounts) {
        List<String> missing = new ArrayList<>();
        if (bucketCounts.getOrDefault("TOP", 0) < 1) {
            missing.add("TOP");
        }
        if (bucketCounts.getOrDefault("BOTTOM", 0) < 1) {
            missing.add("BOTTOM");
        }
        if (bucketCounts.getOrDefault("FOOTWEAR", 0) < 1) {
            missing.add("FOOTWEAR");
        }
        return missing;
    }

    private static WebApplicationException recommendationUnprocessable(
            String userId,
            int requestItemCount,
            Collection<Wearable> wearables,
            Map<String, Integer> bucketCounts,
            List<String> missingBuckets,
            String message
    ) {
        List<String> categoryNames = wearables.stream()
                .map(w -> w.category == null ? null : w.category.name)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .sorted(Comparator.naturalOrder())
                .toList();

        LOG.warnf(
                "Outfit recommendation returned 422 userId=%s requestItemCount=%d missingBuckets=%s bucketCounts=%s categoryNames=%s",
                userId,
                requestItemCount,
                missingBuckets,
                bucketCounts,
                categoryNames
        );

        OutfitRecommendationErrorDto payload = new OutfitRecommendationErrorDto(
                "OUTFIT_COMBINATION_NOT_POSSIBLE",
                message,
                List.copyOf(missingBuckets),
                Map.copyOf(bucketCounts)
        );

        return new WebApplicationException(
                Response.status(422)
                        .type(MediaType.APPLICATION_JSON)
                        .entity(payload)
                        .build()
        );
    }

    private String responseBodyAsString(Response response) {
        Object entity = response.getEntity();
        if (entity == null) {
            return "";
        }
        if (entity instanceof byte[] bytes) {
            return new String(bytes);
        }
        return String.valueOf(entity);
    }
}
