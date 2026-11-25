package pl.babicz.events_backend.unit;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import pl.babicz.events_backend.config.JwtService;
import pl.babicz.events_backend.model.AppUser;
import pl.babicz.events_backend.model.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTest {

    private static final String SECRET = "tajny-klucz-do-testow-ktory-ma-ponad-32-bajty!";

    private AppUser user(String email, Role role) {
        AppUser user = new AppUser();
        user.setEmail(email);
        user.setRoleName(role);
        return user;
    }

    @Test
    @DisplayName("Token zawiera e-mail użytkownika i jego rolę")
    void tokenContainsEmailAndRole() {
        JwtService jwt = new JwtService(SECRET, 60);

        Claims claims = jwt.parse(jwt.generateToken(user("jan@test.pl", Role.ORGANIZER)));

        assertThat(claims.getSubject()).isEqualTo("jan@test.pl");
        assertThat(claims.get("role", String.class)).isEqualTo("ORGANIZER");
    }

    @Test
    @DisplayName("Token z podmienioną zawartością jest odrzucany")
    void tamperedTokenIsRejected() {
        JwtService jwt = new JwtService(SECRET, 60);
        String token = jwt.generateToken(user("jan@test.pl", Role.USER));
        String[] parts = token.split("\\.");
        // psujemy środkową część (dane), zostawiając oryginalny podpis
        String tampered = parts[0] + "." + parts[1].substring(0, parts[1].length() - 2) + "xx." + parts[2];

        assertThrows(JwtException.class, () -> jwt.parse(tampered));
    }

    @Test
    @DisplayName("Token podpisany innym kluczem jest odrzucany")
    void tokenFromOtherKeyIsRejected() {
        JwtService attacker = new JwtService("zupelnie-inny-klucz-ktory-tez-ma-ponad-32-bajty", 60);
        JwtService server = new JwtService(SECRET, 60);

        String foreignToken = attacker.generateToken(user("admin@test.pl", Role.ADMIN));

        assertThrows(JwtException.class, () -> server.parse(foreignToken));
    }

    @Test
    @DisplayName("Wygasły token jest odrzucany")
    void expiredTokenIsRejected() {
        JwtService jwt = new JwtService(SECRET, -1); // ważny „minutę temu”

        String token = jwt.generateToken(user("jan@test.pl", Role.USER));

        assertThrows(JwtException.class, () -> jwt.parse(token));
    }
}