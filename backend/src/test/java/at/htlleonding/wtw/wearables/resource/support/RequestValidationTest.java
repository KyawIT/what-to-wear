package at.htlleonding.wtw.wearables.resource.support;

import jakarta.ws.rs.BadRequestException;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RequestValidationTest {

    @Test
    void parseRequiredUuid_returnsUuidForValidValue() {
        UUID expected = UUID.randomUUID();

        UUID actual = RequestValidation.parseRequiredUuid(expected.toString(), "id");

        assertEquals(expected, actual);
    }

    @Test
    void parseRequiredUuid_rejectsBlankValue() {
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> RequestValidation.parseRequiredUuid(" ", "id")
        );

        assertEquals("id is required", exception.getMessage());
    }

    @Test
    void parseRequiredUuid_rejectsInvalidValue() {
        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> RequestValidation.parseRequiredUuid("invalid", "id")
        );

        assertEquals("Invalid id", exception.getMessage());
    }
}
