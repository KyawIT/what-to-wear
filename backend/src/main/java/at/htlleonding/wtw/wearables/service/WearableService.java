package at.htlleonding.wtw.wearables.service;

import at.htlleonding.wtw.wearables.dto.UploadResultDto;
import at.htlleonding.wtw.wearables.dto.WearableResponseDto;
import at.htlleonding.wtw.wearables.model.Wearable;
import at.htlleonding.wtw.wearables.model.WearableCategory;
import at.htlleonding.wtw.wearables.repository.WearableRepository;
import at.htlleonding.wtw.wearables.util.WearablesUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class WearableService {

    private final WearableRepository repo;
    private final WearablesUtil wearablesUtil;

    public WearableService(WearableRepository repo, WearablesUtil wearablesUtil) {
        this.repo = repo;
        this.wearablesUtil = wearablesUtil;
    }

    @Transactional
    public Wearable create(
            String userId,
            WearableCategory category,
            String title,
            String description,
            List<String> tags,
            String fileName,
            String contentType,
            InputStream imageStream
    ) {
        if (userId == null) throw new IllegalArgumentException("userId is required");
        if (category == null) throw new IllegalArgumentException("category is required");
        if (title == null || title.isBlank()) throw new IllegalArgumentException("title is required");

        Wearable w = new Wearable();
        w.userId = userId;
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

        return w;
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
        List<Wearable> wearables = repo.list("userId", userId);

        List<WearableResponseDto> out = new ArrayList<>(wearables.size());
        for (Wearable w : wearables) {
            WearableResponseDto dto = new WearableResponseDto();
            dto.id = w.id;
            dto.userId = w.userId;
            dto.category = w.category;
            dto.title = w.title;
            dto.description = w.description;

            // IMPORTANT: copy while session is open
            dto.tags = (w.tags == null) ? List.of() : new ArrayList<>(w.tags);

            dto.cutoutImageKey = w.cutoutImageKey;
            dto.cutoutImageUrl = (w.cutoutImageKey == null) ? null : wearablesUtil.presignedGetUrl(w.cutoutImageKey, 600);

            dto.createdAt = w.createdAt;
            dto.updatedAt = w.updatedAt;

            out.add(dto);
        }

        return out;
    }

    @Transactional
    public List<WearableResponseDto> getByUserIdAndCategory(String userId, WearableCategory category) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }
        if (category == null) {
            throw new IllegalArgumentException("category is required");
        }

        List<Wearable> wearables =
                repo.list("userId = ?1 and category = ?2", userId, category);

        List<WearableResponseDto> out = new ArrayList<>(wearables.size());

        for (Wearable w : wearables) {
            WearableResponseDto dto = new WearableResponseDto();

            dto.id = w.id;
            dto.userId = w.userId;
            dto.category = w.category;
            dto.title = w.title;
            dto.description = w.description;

            // IMPORTANT: copy tags inside transaction (prevents LazyInitializationException)
            dto.tags = (w.tags == null) ? List.of() : new ArrayList<>(w.tags);

            dto.cutoutImageKey = w.cutoutImageKey;

            if (w.cutoutImageKey != null && !w.cutoutImageKey.isBlank()) {
                dto.cutoutImageUrl =
                        wearablesUtil.presignedGetUrl(w.cutoutImageKey, 600); // 10 min
            }

            dto.createdAt = w.createdAt;
            dto.updatedAt = w.updatedAt;

            out.add(dto);
        }

        return out;
    }


    private static WearableResponseDto toResponse(Wearable w) {
        WearableResponseDto r = new WearableResponseDto();
        r.id = w.id;
        r.userId = w.userId;
        r.category = w.category;
        r.title = w.title;
        r.description = w.description;
        r.tags = w.tags;
        r.cutoutImageKey = w.cutoutImageKey;
        r.createdAt = w.createdAt;
        r.updatedAt = w.updatedAt;
        return r;
    }
}
