package at.htlleonding.wtw.wearables.service;

import at.htlleonding.wtw.wearables.dto.OutfitResponseDto;
import at.htlleonding.wtw.wearables.dto.UploadResultDto;
import at.htlleonding.wtw.wearables.dto.WearableResponseDto;
import at.htlleonding.wtw.wearables.model.Outfit;
import at.htlleonding.wtw.wearables.model.Wearable;
import at.htlleonding.wtw.wearables.repository.OutfitRepository;
import at.htlleonding.wtw.wearables.repository.WearableRepository;
import at.htlleonding.wtw.wearables.util.OutfitsUtil;
import at.htlleonding.wtw.wearables.util.WearablesUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class OutfitService {

    private final OutfitRepository repo;
    private final WearableRepository wearableRepo;
    private final OutfitsUtil outfitsUtil;
    private final WearablesUtil wearablesUtil;

    public OutfitService(
            OutfitRepository repo,
            WearableRepository wearableRepo,
            OutfitsUtil outfitsUtil,
            WearablesUtil wearablesUtil) {
        this.repo = repo;
        this.wearableRepo = wearableRepo;
        this.outfitsUtil = outfitsUtil;
        this.wearablesUtil = wearablesUtil;
    }

    @Transactional
    public OutfitResponseDto create(
            String userId,
            String title,
            String description,
            List<String> tags,
            List<UUID> wearableIds,
            String fileName,
            String contentType,
            InputStream imageStream) {
        if (userId == null || userId.isBlank())
            throw new IllegalArgumentException("userId is required");
        if (title == null || title.isBlank())
            throw new IllegalArgumentException("title is required");

        String userIdTrim = userId.trim();

        // Resolve wearables — all must belong to this user
        List<Wearable> wearables = new ArrayList<>();
        if (wearableIds != null) {
            for (UUID wId : wearableIds) {
                Wearable w = wearableRepo.find("id = ?1 and userId = ?2", wId, userIdTrim).firstResult();
                if (w == null) {
                    throw new IllegalArgumentException("Wearable not found: " + wId);
                }
                wearables.add(w);
            }
        }

        Outfit outfit = new Outfit();
        outfit.userId = userIdTrim;
        outfit.title = title.trim();
        outfit.description = normalize(description);
        outfit.tags = (tags == null) ? List.of() : normalizeTags(tags);
        outfit.wearables = wearables;

        repo.persist(outfit); // UUID generated here

        // Upload image if provided
        if (imageStream != null) {
            UploadResultDto r = outfitsUtil.uploadOutfitImage(
                    userIdTrim,
                    outfit.id,
                    fileName,
                    imageStream,
                    contentType);
            outfit.imageKey = r.objectKey();
        }

        return toResponseDto(outfit);
    }

    @Transactional
    public List<OutfitResponseDto> getByUserId(String userId) {
        String userIdTrim = (userId == null) ? null : userId.trim();
        List<Outfit> outfits = repo.find("userId = ?1 order by createdAt desc", userIdTrim).list();

        List<OutfitResponseDto> out = new ArrayList<>(outfits.size());
        for (Outfit o : outfits) {
            out.add(toResponseDto(o));
        }
        return out;
    }

    @Transactional
    public OutfitResponseDto getById(String userId, UUID outfitId) {
        if (userId == null || userId.isBlank())
            throw new IllegalArgumentException("userId is required");
        if (outfitId == null)
            throw new IllegalArgumentException("outfitId is required");

        Outfit outfit = repo.find("id = ?1 and userId = ?2", outfitId, userId.trim()).firstResult();
        if (outfit == null)
            throw new NotFoundException("Outfit not found");

        return toResponseDto(outfit);
    }

    @Transactional
    public void delete(String userId, UUID outfitId) {
        if (userId == null || userId.isBlank())
            throw new IllegalArgumentException("userId is required");
        if (outfitId == null)
            throw new IllegalArgumentException("outfitId is required");

        Outfit outfit = repo.find("id = ?1 and userId = ?2", outfitId, userId.trim()).firstResult();
        if (outfit == null)
            throw new NotFoundException("Outfit not found");

        // Delete image from MinIO
        if (outfit.imageKey != null && !outfit.imageKey.isBlank()) {
            outfitsUtil.deleteOutfitImage(outfit.imageKey);
        }

        repo.delete(outfit);
    }

    @Transactional
    public OutfitResponseDto update(
            String userId,
            UUID outfitId,
            String title,
            String description,
            List<String> tags,
            List<UUID> wearableIds
    ) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }
        if (outfitId == null) {
            throw new IllegalArgumentException("outfitId is required");
        }
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("title is required");
        }

        String userIdTrim = userId.trim();
        Outfit outfit = repo.find("id = ?1 and userId = ?2", outfitId, userIdTrim).firstResult();
        if (outfit == null) {
            throw new NotFoundException("Outfit not found");
        }

        List<Wearable> wearables = new ArrayList<>();
        if (wearableIds != null) {
            for (UUID wearableId : wearableIds) {
                Wearable wearable = wearableRepo.find("id = ?1 and userId = ?2", wearableId, userIdTrim).firstResult();
                if (wearable == null) {
                    throw new IllegalArgumentException("Wearable not found: " + wearableId);
                }
                wearables.add(wearable);
            }
        }

        outfit.title = title.trim();
        outfit.description = normalize(description);
        outfit.tags = (tags == null) ? List.of() : normalizeTags(tags);
        outfit.wearables = wearables;

        repo.flush();

        return toResponseDto(outfit);
    }

    // --- Helper: map entity to response DTO ---

    private OutfitResponseDto toResponseDto(Outfit o) {
        List<WearableResponseDto> wearableDtos = new ArrayList<>();
        if (o.wearables != null) {
            List<Wearable> sortedWearables = new ArrayList<>(o.wearables);
            sortedWearables.sort(Comparator.comparing((Wearable w) -> w.createdAt).reversed());
            for (Wearable w : sortedWearables) {
                wearableDtos.add(new WearableResponseDto(
                        w.id,
                        w.userId,
                        (w.category == null) ? null : w.category.id,
                        (w.category == null) ? null : w.category.name,
                        w.title,
                        w.description,
                        (w.tags == null) ? List.of() : new ArrayList<>(w.tags),
                        w.cutoutImageKey,
                        (w.cutoutImageKey == null) ? null : wearablesUtil.presignedGetUrl(w.cutoutImageKey, 600),
                        w.createdAt,
                        w.updatedAt));
            }
        }

        return new OutfitResponseDto(
                o.id,
                o.userId,
                o.title,
                o.description,
                (o.tags == null) ? List.of() : new ArrayList<>(o.tags),
                o.imageKey,
                (o.imageKey == null) ? null : outfitsUtil.presignedGetUrl(o.imageKey, 600),
                wearableDtos,
                o.createdAt,
                o.updatedAt);
    }

    private static String normalize(String v) {
        return (v == null || v.isBlank()) ? null : v.trim();
    }

    private static List<String> normalizeTags(List<String> tags) {
        List<String> out = new ArrayList<>();
        for (String t : tags) {
            if (t == null)
                continue;
            String x = t.trim();
            if (!x.isEmpty())
                out.add(x);
        }
        return out;
    }
}
