package at.htlleonding.wtw.wearables.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "wtw_outfit")
public class Outfit {
    @Id
    @GeneratedValue
    public UUID id;

    @Column(nullable = false)
    public String userId;

    @Column(nullable = false)
    public String title;

    @Column(length = 1000)
    public String description;

    public String imageKey;

    @ElementCollection
    @CollectionTable(name = "wtw_outfit_tags")
    @Column(name = "tags")
    public List<String> tags;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "wtw_outfit_wearables", joinColumns = @JoinColumn(name = "outfit_id"), inverseJoinColumns = @JoinColumn(name = "wearable_id"))
    public List<Wearable> wearables;

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
