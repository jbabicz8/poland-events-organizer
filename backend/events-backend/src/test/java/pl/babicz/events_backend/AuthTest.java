package pl.babicz.events_backend;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class AuthTest extends AbstractIntegrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    private String registerJson(String email, String password, boolean organizer) {
        return """
                {"email":"%s","password":"%s","displayName":"Jan","asOrganizer":%s}
                """.formatted(email, password, organizer);
    }

    @Test
    @DisplayName("Rejestracja zwykłego konta daje rolę USER i token")
    void registerCreateUser() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson(uniqueEmail("user"), PASSWORD, false)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @DisplayName("Rejestracja jako organizator daje rolę ORGANIZER")
    void registerCreatesOrganizer() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson(uniqueEmail("org"), PASSWORD, true)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("ORGANIZER"));
    }

    @Test
    @DisplayName("Ten sam e-mail nie może zostać zarejestrowany dwa razy (409)")
    void duplicateEmailIsRejected() throws Exception {
        String email = uniqueEmail("dup");
        String body = registerJson(email, PASSWORD, false);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Zbyt krótkie hasło jest odrzucane (400)")
    void shortPasswordIsRejected() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson(uniqueEmail("short"), "krotkie", false)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Niepoprawny adres e-mail jest odrzucany (400)")
    void invalidEmailIsRejected() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerJson("to-nie-jest-email", PASSWORD, false)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Logowanie poprawnym hasłem zwraca token")
    void loginWithCorrectPassword() throws Exception {
        String email = uniqueEmail("login");
        registerAndGetToken(email, false);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    @DisplayName("Logowanie błędnym hasłem jest odrzucane (401)")
    void loginWithWrongPassword() throws Exception {
        String email = uniqueEmail("wrong");
        registerAndGetToken(email, false);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"zlehaslo123\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Hasło w bazie jest zapisane jako skrót BCrypt, a nie jawnym tekstem (NF1)")
    void passwordIsStoredHashed() throws Exception {
        String email = uniqueEmail("hash");
        registerAndGetToken(email, false);

        String stored = jdbc.queryForObject(
                "select password_hash from app_user where email = ?", String.class, email);

        assertThat(stored).isNotEqualTo(PASSWORD);
        assertThat(stored).startsWith("$2");
    }
}
