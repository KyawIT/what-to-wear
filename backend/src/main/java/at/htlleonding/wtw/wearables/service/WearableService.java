package at.htlleonding.wtw.wearables.service;

import at.htlleonding.wtw.wearables.dto.UploadResultDto;
import at.htlleonding.wtw.wearables.dto.WearableResponseDto;
import at.htlleonding.wtw.wearables.model.Outfit;
import at.htlleonding.wtw.wearables.model.Wearable;
import at.htlleonding.wtw.wearables.model.WearableCategory;
import at.htlleonding.wtw.wearables.repository.OutfitRepository;
import at.htlleonding.wtw.wearables.repository.WearableCategoryRepository;
import at.htlleonding.wtw.wearables.repository.WearableRepository;
import at.htlleonding.wtw.wearables.util.WearablesUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class WearableService {

    private final WearableRepository repo;
    private final OutfitRepository outfitRepo;
    private final WearableCategoryRepository categoryRepo;
    private final WearablesUtil wearablesUtil;
    private final WearableAiWearableSyncService pythonWearableSyncService;

    public WearableService(
            WearableRepository repo,
            OutfitRepository outfitRepo,
            WearableCategoryRepository categoryRepo,
            WearablesUtil wearablesUtil,
            WearableAiWearableSyncService pythonWearableSyncService
    ) {
        this.repo = repo;
        this.outfitRepo = outfitRepo;
        this.categoryRepo = categoryRepo;
        this.wearablesUtil = wearablesUtil;
        this.pythonWearableSyncService = pythonWearableSyncService;
    }

    @Transactional
    public WearableResponseDto create(
            String userId,
            UUID categoryId,
            String title,
            String description,
            List<String> tags,
            String fileName,
            String contentType,
            InputStream imageStream
    ) {
        if (userId == null) throw new IllegalArgumentException("userId is required");
        if (categoryId == null) throw new IllegalArgumentException("categoryId is required");
        if (title == null || title.isBlank()) throw new IllegalArgumentException("title is required");

        String userIdTrim = userId.trim();
        WearableCategory category = categoryRepo
                .find("id = ?1 and userId = ?2", categoryId, userIdTrim)
                .firstResult();
        if (category == null) throw new IllegalArgumentException("category not found");

        Wearable w = new Wearable();
        w.userId = userIdTrim;
        w.category = category;
        w.title = title.trim();
        w.description = normalize(description);
        w.tags = (tags == null) ? List.of() : normalizeTags(tags);

        repo.persist(w); // UUID is generated here

        if (imageStream != null) {
            UploadResultDto r = wearablesUtil.uploadWearableImage(
                    userId,
                    w.id,
                    fileName,
                    imageStream,
                    contentType
            );
            w.cutoutImageKey = r.objectKey(); // store only key in DB
        }

        return new WearableResponseDto(
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
                w.updatedAt
        );
    }

    private static String normalize(String v) {
        return (v == null || v.isBlank()) ? null : v.trim();
    }

    private static List<String> normalizeTags(List<String> tags) {
        List<String> out = new ArrayList<>();
        for (String t : tags) {
            if (t == null) continue;
            String x = t.trim();
            if (!x.isEmpty()) out.add(x);
        }
        return out;
    }

    @Transactional
    public List<WearableResponseDto> getByUserId(String userId) {
        String userIdTrim = (userId == null) ? null : userId.trim();
        List<Wearable> wearables = repo.find("userId = ?1 order by createdAt desc", userIdTrim).list();

        List<WearableResponseDto> out = new ArrayList<>(wearables.size());
        for (Wearable w : wearables) {
            out.add(new WearableResponseDto(
                    w.id,
                    w.userId,
                    (w.category == null) ? null : w.category.id,
                    (w.category == null) ? null : w.category.name,
                    w.title,
                    w.description,
                    // IMPORTANT: copy while session is open
                    (w.tags == null) ? List.of() : new ArrayList<>(w.tags),
                    w.cutoutImageKey,
                    (w.cutoutImageKey == null) ? null : wearablesUtil.presignedGetUrl(w.cutoutImageKey, 600),
                    w.createdAt,
                    w.updatedAt
            ));
        }

        return out;
    }

    @Transactional
    public List<WearableResponseDto> getByUserIdAndCategory(String userId, UUID categoryId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }
        if (categoryId == null) {
            throw new IllegalArgumentException("categoryId is required");
        }

        String userIdTrim = userId.trim();
        WearableCategory category = categoryRepo
                .find("id = ?1 and userId = ?2", categoryId, userIdTrim)
                .firstResult();
        if (category == null) {
            throw new IllegalArgumentException("category not found");
        }

        List<Wearable> wearables =
                repo.find("userId = ?1 and category = ?2 order by createdAt desc", userIdTrim, category).list();

        List<WearableResponseDto> out = new ArrayList<>(wearables.size());

        for (Wearable w : wearables) {
            String cutoutImageUrl = null;
            if (w.cutoutImageKey != null && !w.cutoutImageKey.isBlank()) {
                cutoutImageUrl = wearablesUtil.presignedGetUrl(w.cutoutImageKey, 600); // 10 min
            }

            out.add(new WearableResponseDto(
                    w.id,
                    w.userId,
                    (w.category == null) ? null : w.category.id,
                    (w.category == null) ? null : w.category.name,
                    w.title,
                    w.description,
                    // IMPORTANT: copy tags inside transaction (prevents LazyInitializationException)
                    (w.tags == null) ? List.of() : new ArrayList<>(w.tags),
                    w.cutoutImageKey,
                    cutoutImageUrl,
                    w.createdAt,
                    w.updatedAt
            ));
        }

        return out;
    }

    @Transactional
    public WearableResponseDto getByWearableId(String userId, UUID id) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }
        if (id == null) {
            throw new IllegalArgumentException("id is required");
        }

        Wearable wearable = repo.find("id = ?1 and userId = ?2", id, userId.trim()).firstResult();
        if (wearable == null) {
            throw new NotFoundException("Wearable not found");
        }

        return new WearableResponseDto(
                wearable.id,
                wearable.userId,
                (wearable.category == null) ? null : wearable.category.id,
                (wearable.category == null) ? null : wearable.category.name,
                wearable.title,
                wearable.description,
                (wearable.tags == null) ? List.of() : new ArrayList<>(wearable.tags),
                wearable.cutoutImageKey,
                (wearable.cutoutImageKey == null || wearable.cutoutImageKey.isBlank())
                        ? null
                        : wearablesUtil.presignedGetUrl(wearable.cutoutImageKey, 600),
                wearable.createdAt,
                wearable.updatedAt
        );
    }

    @Transactional
    public WearableResponseDto update(
            String userId,
            UUID wearableId,
            UUID categoryId,
            String title,
            String description,
            List<String> tags
    ) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }
        if (wearableId == null) {
            throw new IllegalArgumentException("wearableId is required");
        }
        if (categoryId == null) {
            throw new IllegalArgumentException("categoryId is required");
        }
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("title is required");
        }

        String userIdTrim = userId.trim();
        Wearable wearable = repo.find("id = ?1 and userId = ?2", wearableId, userIdTrim).firstResult();
        if (wearable == null) {
            throw new NotFoundException("Wearable not found");
        }

        WearableCategory category = categoryRepo
                .find("id = ?1 and userId = ?2", categoryId, userIdTrim)
                .firstResult();
        if (category == null) {
            throw new IllegalArgumentException("category not found");
        }

        wearable.category = category;
        wearable.title = title.trim();
        wearable.description = normalize(description);
        wearable.tags = (tags == null) ? List.of() : normalizeTags(tags);

        repo.flush();

        List<String> normalizedTags = (wearable.tags == null) ? List.of() : new ArrayList<>(wearable.tags);
        pythonWearableSyncService.syncWearableUpdateAsync(
                userIdTrim,
                wearable.id,
                category.name,
                normalizedTags
        );

        return new WearableResponseDto(
                wearable.id,
                wearable.userId,
                (wearable.category == null) ? null : wearable.category.id,
                (wearable.category == null) ? null : wearable.category.name,
                wearable.title,
                wearable.description,
                normalizedTags,
                wearable.cutoutImageKey,
                (wearable.cutoutImageKey == null || wearable.cutoutImageKey.isBlank())
                        ? null
                        : wearablesUtil.presignedGetUrl(wearable.cutoutImageKey, 600),
                wearable.createdAt,
                wearable.updatedAt
        );
    }

    @Transactional
    public void delete(String userId, UUID wearableId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }
        if (wearableId == null) {
            throw new IllegalArgumentException("wearableId is required");
        }

        String userIdTrim = userId.trim();
        Wearable wearable = repo.find("id = ?1 and userId = ?2", wearableId, userIdTrim).firstResult();
        if (wearable == null) {
            throw new NotFoundException("Wearable not found");
        }

        List<Outfit> outfits = outfitRepo.list("userId = ?1 and ?2 member of wearables", userIdTrim, wearable);
        for (Outfit outfit : outfits) {
            if (outfit.wearables == null || outfit.wearables.isEmpty()) {
                continue;
            }
            outfit.wearables.removeIf(linkedWearable -> wearableId.equals(linkedWearable.id));
        }
        outfitRepo.flush();

        if (wearable.cutoutImageKey != null && !wearable.cutoutImageKey.isBlank()) {
            wearablesUtil.deleteWearableImage(wearable.cutoutImageKey);
        }

        repo.delete(wearable);
    }
}
