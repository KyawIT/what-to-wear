package at.htlleonding.wtw.wearables.security;

import jakarta.enterprise.context.RequestScoped;
import jakarta.ws.rs.NotAuthorizedException;
import org.eclipse.microprofile.jwt.JsonWebToken;

/**
 * Resolves the authenticated user id from the current JWT token.
 */
@RequestScoped
public class AuthenticatedUserProvider {

    private final JsonWebToken jwt;

    public AuthenticatedUserProvider(JsonWebToken jwt) {
        this.jwt = jwt;
    }

    public String requireUserId() {
        String subject = jwt.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new NotAuthorizedException("Missing sub claim");
        }
        return subject.trim();
    }
}
