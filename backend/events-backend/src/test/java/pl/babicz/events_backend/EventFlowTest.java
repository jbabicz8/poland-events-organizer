package pl.babicz.events_backend;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class EventFlowTest extends AbstractIntegrationTest {

    // ---------- pomocnicze metody ----------

    private long firstId(String url, int index) throws Exception {
        String body = mockMvc.perform(get(url)).andReturn().getResponse().getContentAsString();
        Number id = JsonPath.read(body, "$[" + index + "].id");
        return id.longValue();
    }

    private String uniqueTitle() {
        return "Wydarzenie-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String eventJson(String title, long voivodeshipId, long categoryId, Integer capacity) {
        return """
                {"title":"%s","description":"Opis wydarzenia","startDate":"2030-06-01T18:00:00",
                 "city":"Bydgoszcz","voivodeshipId":%d,"categoryIds":[%d],"capacity":%s}
                """.formatted(title, voivodeshipId, categoryId, capacity);
    }

    /** Organizator dodaje wydarzenie i zwraca jego id. */
    private long createEvent(String organizerToken, String title, Integer capacity) throws Exception {
        String response = mockMvc.perform(post("/api/events")
                        .header("Authorization", bearer(organizerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventJson(title, firstId("/api/voivodeships", 0),
                                firstId("/api/categories", 0), capacity)))
                .andExpect(status().is2xxSuccessful())
                .andReturn().getResponse().getContentAsString();
        Number id = JsonPath.read(response, "$.id");
        return id.longValue();
    }

    private void approve(long eventId) throws Exception {
        mockMvc.perform(post("/api/admin/events/{id}/approve", eventId)
                        .header("Authorization", bearer(adminToken())))
                .andExpect(status().is2xxSuccessful());
    }

    /** Dodaje i od razu zatwierdza wydarzenie, zwraca jego id. */
    private long createApprovedEvent(String title, Integer capacity) throws Exception {
        String organizer = registerAndGetToken(uniqueEmail("org"), true);
        long id = createEvent(organizer, title, capacity);
        approve(id);
        return id;
    }

    // ---------- dodawanie i moderacja ----------

    @Test
    @DisplayName("Organizator dodaje wydarzenie i dostaje status PENDING")
    void organizerCreatesPendingEvent() throws Exception {
        String organizer = registerAndGetToken(uniqueEmail("org"), true);

        mockMvc.perform(post("/api/events")
                        .header("Authorization", bearer(organizer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventJson(uniqueTitle(), firstId("/api/voivodeships", 0),
                                firstId("/api/categories", 0), null)))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("Wydarzenie oczekujące na akceptację nie jest widoczne publicznie")
    void pendingEventIsHidden() throws Exception {
        String title = uniqueTitle();
        String organizer = registerAndGetToken(uniqueEmail("org"), true);
        long id = createEvent(organizer, title, null);

        mockMvc.perform(get("/api/events/{id}", id)).andExpect(status().isNotFound());

        mockMvc.perform(get("/api/events").param("query", title))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    @DisplayName("Po zatwierdzeniu przez admina wydarzenie jest widoczne publicznie")
    void approvedEventIsVisible() throws Exception {
        String title = uniqueTitle();
        long id = createApprovedEvent(title, null);

        mockMvc.perform(get("/api/events/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value(title));

        mockMvc.perform(get("/api/events").param("query", title))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @Test
    @DisplayName("Odrzucone wydarzenie zostaje ukryte, a organizator widzi powód")
    void rejectedEventStaysHiddenAndShowsReason() throws Exception {
        String organizer = registerAndGetToken(uniqueEmail("org"), true);
        long id = createEvent(organizer, uniqueTitle(), null);

        mockMvc.perform(post("/api/admin/events/{id}/reject", id)
                        .header("Authorization", bearer(adminToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Brak szczegółowego opisu\"}"))
                .andExpect(status().is2xxSuccessful());

        mockMvc.perform(get("/api/events/{id}", id)).andExpect(status().isNotFound());

        mockMvc.perform(get("/api/events/mine").header("Authorization", bearer(organizer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + id + ")].status").value("REJECTED"))
                .andExpect(jsonPath("$[?(@.id==" + id + ")].rejectionReason")
                        .value("Brak szczegółowego opisu"));
    }

    @Test
    @DisplayName("Organizator nie może edytować cudzego wydarzenia")
    void organizerCannotEditForeignEvent() throws Exception {
        String owner = registerAndGetToken(uniqueEmail("owner"), true);
        String stranger = registerAndGetToken(uniqueEmail("stranger"), true);
        long id = createEvent(owner, uniqueTitle(), null);

        mockMvc.perform(put("/api/events/{id}", id)
                        .header("Authorization", bearer(stranger))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventJson("Podmieniony tytuł", firstId("/api/voivodeships", 0),
                                firstId("/api/categories", 0), null)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Organizator nie może edytować wydarzenia, które już zatwierdzono")
    void organizerCannotEditApprovedEvent() throws Exception {
        String owner = registerAndGetToken(uniqueEmail("owner"), true);
        long id = createEvent(owner, uniqueTitle(), null);
        approve(id);

        mockMvc.perform(put("/api/events/{id}", id)
                        .header("Authorization", bearer(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventJson("Nowy tytuł", firstId("/api/voivodeships", 0),
                                firstId("/api/categories", 0), null)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Admin może dodać wydarzenie w imieniu organizatora i jest ono od razu publiczne")
    void adminCreatesPublishedEvent() throws Exception {
        String title = uniqueTitle();
        String body = """
                {"organizerName":"Fundacja Test","event":%s}
                """.formatted(eventJson(title, firstId("/api/voivodeships", 0),
                firstId("/api/categories", 0), null));

        mockMvc.perform(post("/api/admin/events")
                        .header("Authorization", bearer(adminToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is2xxSuccessful());

        mockMvc.perform(get("/api/events").param("query", title))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].organizerName").value("Fundacja Test"));
    }

    // ---------- walidacja ----------

    @Test
    @DisplayName("Wydarzenie bez nazwy jest odrzucane (400)")
    void eventWithoutTitleIsRejected() throws Exception {
        String organizer = registerAndGetToken(uniqueEmail("org"), true);

        mockMvc.perform(post("/api/events")
                        .header("Authorization", bearer(organizer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventJson("", firstId("/api/voivodeships", 0),
                                firstId("/api/categories", 0), null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Data zakończenia wcześniejsza niż rozpoczęcia jest odrzucana (400)")
    void endBeforeStartIsRejected() throws Exception {
        String organizer = registerAndGetToken(uniqueEmail("org"), true);
        String body = """
                {"title":"Zła data","startDate":"2030-06-02T18:00:00","endDate":"2030-06-01T18:00:00",
                 "city":"Bydgoszcz","voivodeshipId":%d,"categoryIds":[%d]}
                """.formatted(firstId("/api/voivodeships", 0), firstId("/api/categories", 0));

        mockMvc.perform(post("/api/events")
                        .header("Authorization", bearer(organizer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Ujemny limit miejsc jest odrzucany (400)")
    void negativeCapacityIsRejected() throws Exception {
        String organizer = registerAndGetToken(uniqueEmail("org"), true);

        mockMvc.perform(post("/api/events")
                        .header("Authorization", bearer(organizer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eventJson(uniqueTitle(), firstId("/api/voivodeships", 0),
                                firstId("/api/categories", 0), -5)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Link do strony musi zaczynać się od http:// lub https:// (ochrona przed javascript:)")
    void websiteUrlMustBeHttp() throws Exception {
        String organizer = registerAndGetToken(uniqueEmail("org"), true);
        String body = """
                {"title":"Z linkiem","startDate":"2030-06-01T18:00:00","city":"Bydgoszcz",
                 "voivodeshipId":%d,"categoryIds":[%d],"websiteUrl":"javascript:alert(1)"}
                """.formatted(firstId("/api/voivodeships", 0), firstId("/api/categories", 0));

        mockMvc.perform(post("/api/events")
                        .header("Authorization", bearer(organizer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    // ---------- udział w wydarzeniach i limit miejsc ----------

    @Test
    @DisplayName("Użytkownik zapisuje się na wydarzenie i może się wypisać")
    void userJoinsAndLeaves() throws Exception {
        long id = createApprovedEvent(uniqueTitle(), null);
        String user = registerAndGetToken(uniqueEmail("user"), false);

        mockMvc.perform(post("/api/events/{id}/participation", id)
                        .header("Authorization", bearer(user)))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.participantCount").value(1));

        mockMvc.perform(delete("/api/events/{id}/participation", id)
                        .header("Authorization", bearer(user)))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.participantCount").value(0));
    }

    @Test
    @DisplayName("Nie można zapisać się na wydarzenie, które nie zostało zatwierdzone")
    void cannotJoinPendingEvent() throws Exception {
        String organizer = registerAndGetToken(uniqueEmail("org"), true);
        long id = createEvent(organizer, uniqueTitle(), null);
        String user = registerAndGetToken(uniqueEmail("user"), false);

        mockMvc.perform(post("/api/events/{id}/participation", id)
                        .header("Authorization", bearer(user)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Limit miejsc: gdy miejsc brakuje, zapis jest odrzucany (409)")
    void capacityLimitIsEnforced() throws Exception {
        long id = createApprovedEvent(uniqueTitle(), 1);
        String first = registerAndGetToken(uniqueEmail("user1"), false);
        String second = registerAndGetToken(uniqueEmail("user2"), false);

        mockMvc.perform(post("/api/events/{id}/participation", id)
                        .header("Authorization", bearer(first)))
                .andExpect(status().is2xxSuccessful());

        mockMvc.perform(post("/api/events/{id}/participation", id)
                        .header("Authorization", bearer(second)))
                .andExpect(status().isConflict());

        // po wypisaniu się pierwszej osoby miejsce się zwalnia
        mockMvc.perform(delete("/api/events/{id}/participation", id)
                        .header("Authorization", bearer(first)))
                .andExpect(status().is2xxSuccessful());

        mockMvc.perform(post("/api/events/{id}/participation", id)
                        .header("Authorization", bearer(second)))
                .andExpect(status().is2xxSuccessful());
    }

    @Test
    @DisplayName("Po rozpoczęciu wydarzenia nie można już zadeklarować udziału")
    void cannotJoinAfterStart() throws Exception {
        long id = createApprovedEvent(uniqueTitle(), null);
        jdbcTemplate.update("update event set start_date = now() - interval '1 day' where id = ?", id);
        String user = registerAndGetToken(uniqueEmail("user"), false);

        mockMvc.perform(post("/api/events/{id}/participation", id)
                        .header("Authorization", bearer(user)))
                .andExpect(status().is4xxClientError());
    }

    // ---------- wyszukiwanie i filtrowanie ----------

    @Test
    @DisplayName("Filtr województwa zwraca tylko wydarzenia z tego województwa")
    void voivodeshipFilterWorks() throws Exception {
        String title = uniqueTitle();
        createApprovedEvent(title, null); // województwo o indeksie 0
        long other = firstId("/api/voivodeships", 1);

        mockMvc.perform(get("/api/events")
                        .param("query", title)
                        .param("voivodeshipId", String.valueOf(other)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));

        mockMvc.perform(get("/api/events")
                        .param("query", title)
                        .param("voivodeshipId", String.valueOf(firstId("/api/voivodeships", 0))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }
}