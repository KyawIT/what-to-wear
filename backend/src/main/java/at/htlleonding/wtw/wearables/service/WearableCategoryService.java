package at.htlleonding.wtw.wearables.service;

import at.htlleonding.wtw.wearables.dto.WearableCategoryResponseDto;
import at.htlleonding.wtw.wearables.dto.WearableCategoryRequestDto;
import at.htlleonding.wtw.wearables.model.WearableCategory;
import at.htlleonding.wtw.wearables.repository.WearableRepository;
import at.htlleonding.wtw.wearables.repository.WearableCategoryRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class WearableCategoryService {
    private static final List<String> DEFAULT_CATEGORY_NAMES = List.of(
            "Tops",
            "Bottoms",
            "Outerwear",
            "Footwear",
            "Accessories"
    );

    private final WearableCategoryRepository repo;
    private final WearableRepository wearableRepo;

    public WearableCategoryService(WearableCategoryRepository repo, WearableRepository wearableRepo) {
        this.repo = repo;
        this.wearableRepo = wearableRepo;
    }

    @Transactional
    public WearableCategoryResponseDto create(String userId, WearableCategoryRequestDto dto) {
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("userId is required");
        }
        if (dto == null || dto.name() == null || dto.name().isBlank()) {
            throw new BadRequestException("name is required");
        }

        WearableCategory category = new WearableCategory();
        category.userId = userId.trim();
        category.name = dto.name().trim();
        repo.persist(category);

        return toDto(category);
    }

    @Transactional
    public List<WearableCategoryResponseDto> listByUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("userId is required");
        }
        String userIdTrim = userId.trim();
        ensureDefaultCategories(userIdTrim);
        List<WearableCategory> categories = repo.list("userId", userIdTrim);
        List<WearableCategoryResponseDto> out = new ArrayList<>(categories.size());
        for (WearableCategory c : categories) {
            out.add(toDto(c));
        }
        return out;
    }

    @Transactional
    public WearableCategoryResponseDto getById(String userId, UUID id) {
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("userId is required");
        }
        if (id == null) {
            throw new BadRequestException("id is required");
        }
        WearableCategory category = repo.find("id = ?1 and userId = ?2", id, userId.trim()).firstResult();
        if (category == null) {
            throw new NotFoundException("Category not found");
        }
        return toDto(category);
    }

    @Transactional
    public WearableCategoryResponseDto update(String userId, UUID id, WearableCategoryRequestDto dto) {
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("userId is required");
        }
        if (id == null) {
            throw new BadRequestException("id is required");
        }
        if (dto == null || dto.name() == null || dto.name().isBlank()) {
            throw new BadRequestException("name is required");
        }

        WearableCategory category = repo.find("id = ?1 and userId = ?2", id, userId.trim()).firstResult();
        if (category == null) {
            throw new NotFoundException("Category not found");
        }
        category.name = dto.name().trim();
        return toDto(category);
    }

    @Transactional
    public void delete(String userId, UUID id) {
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("userId is required");
        }
        if (id == null) {
            throw new BadRequestException("id is required");
        }
        String userIdTrim = userId.trim();
        WearableCategory category = repo.find("id = ?1 and userId = ?2", id, userIdTrim).firstResult();
        if (category == null) {
            throw new NotFoundException("Category not found");
        }

        long inUse = wearableRepo.count("userId = ?1 and category = ?2", userIdTrim, category);
        if (inUse > 0) {
            throw new BadRequestException("Category is in use by wearables");
        }

        long deleted = repo.delete("id = ?1 and userId = ?2", id, userIdTrim);
        if (deleted == 0) {
            throw new NotFoundException("Category not found");
        }
    }

    private static WearableCategoryResponseDto toDto(WearableCategory c) {
        return new WearableCategoryResponseDto(
                c.id,
                c.userId,
                c.name,
                c.createdAt,
                c.updatedAt
        );
    }

    private void ensureDefaultCategories(String userId) {
        for (String defaultName : DEFAULT_CATEGORY_NAMES) {
            WearableCategory existing = repo
                    .find("userId = ?1 and name = ?2", userId, defaultName)
                    .firstResult();
            if (existing != null) {
                continue;
            }

            WearableCategory category = new WearableCategory();
            category.userId = userId;
            category.name = defaultName;
            repo.persist(category);
        }
    }
}
