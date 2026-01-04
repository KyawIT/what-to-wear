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
    public String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public WearableCategory category;

    @Column(nullable = false)
    public String title;

    @Column(length = 1000)
    public String description;

    public String cutoutImageKey;

    @ElementCollection
    @CollectionTable(name = "wtw_wearable_tags")
    @Column(name = "tags")
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
