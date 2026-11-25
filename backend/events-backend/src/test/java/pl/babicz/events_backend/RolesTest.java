package pl.babicz.events_backend;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class RolesTest extends AbstractIntegrationTest {

    private static final String EVENT_JSON = """
            {"title":"Test","startDate":"2030-06-01T18:00:00","city":"Bydgoszcz",
             "voivodeshipId":1,"categoryIds":[1]}
            """;

    @Test
    @DisplayName("Lista wydarzeń jest publiczna (bez logowania)")
    void publicListNeedsNoLogin() throws Exception {
        mockMvc.perform(get("/api/events")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Panel admina bez tokenu: 401")
    void adminEndpointWithoutToken() throws Exception {
        mockMvc.perform(get("/api/admin/events/pending"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Panel admina dla zwykłego użytkownika: 403")
    void adminEndpointForUser() throws Exception {
        String token = registerAndGetToken(uniqueEmail("user"), false);

        mockMvc.perform(get("/api/admin/events/pending")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Panel admina dla organizatora: 403")
    void adminEndpointForOrganizer() throws Exception {
        String token = registerAndGetToken(uniqueEmail("org"), true);

        mockMvc.perform(get("/api/admin/events/pending")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Panel admina dla administratora: 200")
    void adminEndpointForAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/events/pending")
                        .header("Authorization", bearer(adminToken())))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Zwykły użytkownik nie może dodawać wydarzeń (403)")
    void userCannotCreateEvent() throws Exception {
        String token = registerAndGetToken(uniqueEmail("user"), false);

        mockMvc.perform(post("/api/events")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EVENT_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Zwykły użytkownik nie widzi listy „moje zgłoszenia” organizatora (403)")
    void userCannotSeeOrganizerList() throws Exception {
        String token = registerAndGetToken(uniqueEmail("user"), false);

        mockMvc.perform(get("/api/events/mine")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Organizator nie może deklarować udziału w wydarzeniu (403)")
    void organizerCannotParticipate() throws Exception {
        String token = registerAndGetToken(uniqueEmail("org"), true);

        mockMvc.perform(post("/api/events/1/participation")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Administrator nie może deklarować udziału w wydarzeniu (403)")
    void adminCannotParticipate() throws Exception {
        mockMvc.perform(post("/api/events/1/participation")
                        .header("Authorization", bearer(adminToken())))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Lista „moje zgłoszenia” bez tokenu: 401")
    void mineWithoutToken() throws Exception {
        mockMvc.perform(get("/api/events/mine"))
                .andExpect(status().isUnauthorized());
    }
}
