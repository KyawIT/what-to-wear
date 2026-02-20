package at.htlleonding.wtw.wearables.repository;

import at.htlleonding.wtw.wearables.model.WearableCategory;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class WearableCategoryRepository implements PanacheRepository<WearableCategory> {
}
