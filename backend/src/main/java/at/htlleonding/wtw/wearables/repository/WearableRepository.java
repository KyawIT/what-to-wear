package at.htlleonding.wtw.wearables.repository;

import at.htlleonding.wtw.wearables.model.Wearable;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class WearableRepository implements PanacheRepository<Wearable> {
}
