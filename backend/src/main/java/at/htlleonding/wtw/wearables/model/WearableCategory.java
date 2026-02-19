package at.htlleonding.wtw.wearables.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "wtw_wearable_category",
        uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "name"})
)
public class WearableCategory {
    @Id
    @GeneratedValue
    public UUID id;

    @Column(nullable = false)
    public String userId;

    @Column(nullable = false, length = 100)
    public String name;

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
