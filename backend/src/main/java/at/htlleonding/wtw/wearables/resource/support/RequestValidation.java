package at.htlleonding.wtw.wearables.resource.support;

import jakarta.ws.rs.BadRequestException;

import java.util.UUID;

/**
 * Shared request validation helpers for REST resources.
 */
public final class RequestValidation {

    private RequestValidation() {
    }

    public static UUID parseRequiredUuid(String rawValue, String fieldName) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new BadRequestException(fieldName + " is required");
        }

        try {
            return UUID.fromString(rawValue.trim());
        } catch (Exception e) {
            throw new BadRequestException("Invalid " + fieldName);
        }
    }

    public static String requireNonBlank(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(fieldName + " is required");
        }
        return value.trim();
    }
}
