package at.htlleonding.wtw.wearables.util;

import at.htlleonding.wtw.wearables.dto.UploadResultDto;
import io.minio.*;
import io.minio.http.Method;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@ApplicationScoped
public class OutfitsUtil {
    private static final Logger LOG = Logger.getLogger(OutfitsUtil.class);

    private final MinioClient minio;
    private final String bucket;
    private final String endpoint;
    private final String publicBaseUrl;

    public OutfitsUtil(
            MinioClient minio,
            @ConfigProperty(name = "app.minio.outfits.bucket", defaultValue = "outfits") String bucket,
            @ConfigProperty(name = "quarkus.minio.url") String endpoint,
            @ConfigProperty(name = "app.minio.public-base-url", defaultValue = "") String publicBaseUrl) {
        this.minio = minio;
        this.bucket = bucket;
        this.endpoint = endpoint;
        this.publicBaseUrl = publicBaseUrl;
    }

    /**
     * Upload an outfit image to MinIO.
     * Storage key: {userId}/{outfitId}/{fileName}
     */
    public UploadResultDto uploadOutfitImage(
            String userId,
            UUID outfitId,
            String fileName,
            InputStream inputStream,
            String contentType) {
        ensureBucketExists();

        String safeUserId = sanitizeUserId(userId);
        String safeFileName = sanitizeFileName(fileName);
        String prefix = safeUserId + "/" + outfitId;
        String objectKey = prefix + "/" + safeFileName;

        createFolderMarkerIfMissing(prefix);

        try {
            PutObjectArgs putArgs = PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .stream(inputStream, -1, 10 * 1024 * 1024)
                    .contentType(normalizeContentType(contentType, safeFileName))
                    .build();

            minio.putObject(putArgs);

            return new UploadResultDto(objectKey, buildPublicUrl(objectKey));
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload outfit image to MinIO", e);
        }
    }

    public void deleteOutfitImage(String objectKey) {
        if (objectKey == null || objectKey.isBlank())
            return;
        try {
            minio.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectKey)
                            .build());
        } catch (Exception e) {
            LOG.warnf(e, "Failed to delete outfit image from MinIO: %s", objectKey);
        }
    }

    public void ensureBucketExists() {
        try {
            boolean exists = minio.bucketExists(
                    BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                minio.makeBucket(
                        MakeBucketArgs.builder().bucket(bucket).build());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to ensure MinIO bucket exists: " + bucket, e);
        }
    }

    public void createFolderMarkerIfMissing(String prefix) {
        String markerKey = normalizePrefix(prefix) + "/";
        try {
            minio.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucket)
                            .object(markerKey)
                            .build());
        } catch (Exception ignored) {
            try {
                PutObjectArgs putArgs = PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(markerKey)
                        .stream(new ByteArrayInputStream(new byte[0]), 0, -1)
                        .contentType("application/x-directory")
                        .build();
                minio.putObject(putArgs);
            } catch (Exception e) {
                throw new RuntimeException("Failed to create folder marker in MinIO: " + markerKey, e);
            }
        }
    }

    public String presignedGetUrl(String objectKey, int expirySeconds) {
        try {
            String signedUrl = minio.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucket)
                            .object(objectKey)
                            .expiry(expirySeconds)
                            .build());
            return rewriteToPublicBase(signedUrl);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create presigned URL", e);
        }
    }

    private String rewriteToPublicBase(String signedUrl) {
        if (publicBaseUrl == null || publicBaseUrl.isBlank()) {
            return signedUrl;
        }
        try {
            URI signed = URI.create(signedUrl);
            URI base = URI.create(trimTrailingSlash(publicBaseUrl));
            String prefix = trimTrailingSlash(base.getPath());
            String path = (signed.getPath() == null) ? "" : signed.getPath();
            String mergedPath = (prefix.isEmpty() ? "" : prefix) + path;
            URI rewritten = new URI(
                    base.getScheme(),
                    base.getAuthority(),
                    mergedPath,
                    signed.getQuery(),
                    signed.getFragment());
            return rewritten.toString();
        } catch (Exception e) {
            LOG.warnf(e, "Failed to rewrite presigned URL to public base. Returning original URL.");
            return signedUrl;
        }
    }

    public String buildPublicUrl(String objectKey) {
        String base = (publicBaseUrl == null || publicBaseUrl.isBlank()) ? endpoint : publicBaseUrl;
        base = trimTrailingSlash(base);
        return base + "/" + bucket + "/" + objectKey;
    }

    // --- parse helpers (reusable from WearablesUtil pattern) ---

    public static List<String> parseTags(String raw) {
        if (raw == null || raw.isBlank())
            return List.of();
        String[] parts = raw.split(",");
        List<String> out = new ArrayList<>();
        for (String p : parts) {
            String t = p.trim();
            if (!t.isEmpty())
                out.add(t);
        }
        return out;
    }

    public static List<UUID> parseUuidList(String raw) {
        if (raw == null || raw.isBlank())
            return List.of();
        String[] parts = raw.split(",");
        List<UUID> out = new ArrayList<>();
        for (String p : parts) {
            String t = p.trim();
            if (!t.isEmpty())
                out.add(UUID.fromString(t));
        }
        return out;
    }

    // --- private helpers ---

    private static String sanitizeUserId(String userId) {
        if (userId == null)
            return "unknown";
        String t = userId.trim();
        return t.isEmpty() ? "unknown" : t.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private static String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) {
            return UUID.randomUUID() + ".png";
        }
        String t = fileName.trim();
        t = t.replace("\\", "/");
        int idx = t.lastIndexOf("/");
        String name = (idx >= 0) ? t.substring(idx + 1) : t;
        name = name.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (name.isEmpty())
            return UUID.randomUUID() + ".png";
        return name;
    }

    private static String normalizePrefix(String prefix) {
        if (prefix == null)
            return "unknown";
        String t = prefix.trim();
        while (t.startsWith("/"))
            t = t.substring(1);
        while (t.endsWith("/"))
            t = t.substring(0, t.length() - 1);
        return t.isEmpty() ? "unknown" : t;
    }

    private static String trimTrailingSlash(String s) {
        if (s == null)
            return "";
        String t = s.trim();
        while (t.endsWith("/"))
            t = t.substring(0, t.length() - 1);
        return t;
    }

    private static String normalizeContentType(String contentType, String fileName) {
        if (contentType != null && !contentType.isBlank())
            return contentType.trim().toLowerCase(Locale.ROOT);
        String lower = (fileName == null) ? "" : fileName.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png"))
            return "image/png";
        if (lower.endsWith(".webp"))
            return "image/webp";
        if (lower.endsWith(".jpeg") || lower.endsWith(".jpg"))
            return "image/jpeg";
        return "application/octet-stream";
    }
}
