package at.htlleonding.wtw.wearables.repository;

import at.htlleonding.wtw.wearables.model.Outfit;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class OutfitRepository implements PanacheRepository<Outfit> {
}
