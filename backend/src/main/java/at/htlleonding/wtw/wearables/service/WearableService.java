package at.htlleonding.wtw.wearables.service;

import at.htlleonding.wtw.wearables.dto.UploadResultDto;
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
            UUID userId,
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
                    userId.toString(),
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
}
