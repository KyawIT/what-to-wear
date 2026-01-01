package at.htlleonding.wtw.wearables.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "wtw_wearable")
public class Wearable {
    @Id
    @GeneratedValue
    public UUID id;

    @Column(nullable = false)
    public UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public WearableCategory category;

    @Column(nullable = false)
    public String title;

    @Column(length = 1000)
    public String description;

    // --- MinIO object keys ---
    public String originalImageKey;
    public String cutoutImageKey;

    @ElementCollection
    @CollectionTable(name = "wearable_tags")
    @Column(name = "tag")
    public List<String> tags;

    @Column(nullable = false, updatable = false)
    public Instant createdAt;

    public Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
