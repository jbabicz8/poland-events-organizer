package pl.babicz.events_backend;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ConcurrencyTest extends AbstractIntegrationTest {

    private long firstId(String url) throws Exception {
        String body = mockMvc.perform(get(url)).andReturn().getResponse().getContentAsString();
        Number id = JsonPath.read(body, "$[0].id");
        return id.longValue();
    }

    private long createApprovedEvent(int capacity) throws Exception {
        String organizer = registerAndGetToken(uniqueEmail("org"), true);
        String json = """
                {"title":"Ostatnie miejsca","startDate":"2030-06-01T18:00:00","city":"Bydgoszcz",
                 "voivodeshipId":%d,"categoryIds":[%d],"capacity":%d}
                """.formatted(firstId("/api/voivodeships"), firstId("/api/categories"), capacity);

        String response = mockMvc.perform(post("/api/events")
                        .header("Authorization", bearer(organizer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().is2xxSuccessful())
                .andReturn().getResponse().getContentAsString();
        long id = ((Number) JsonPath.read(response, "$.id")).longValue();

        mockMvc.perform(post("/api/admin/events/{id}/approve", id)
                        .header("Authorization", bearer(adminToken())))
                .andExpect(status().is2xxSuccessful());
        return id;
    }

    @Test
    @DisplayName("10 osób zapisuje się naraz na 3 miejsca: dokładnie 3 się udaje, licznik nie przekracza limitu")
    void lastSeatsAreNeverOversold() throws Exception {
        int capacity = 3;
        int people = 10;
        long eventId = createApprovedEvent(capacity);

        List<String> tokens = new ArrayList<>();
        for (int i = 0; i < people; i++) {
            tokens.add(registerAndGetToken(uniqueEmail("user"), false));
        }

        CountDownLatch startSignal = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(people);
        List<Future<Integer>> results = new ArrayList<>();

        for (String token : tokens) {
            Callable<Integer> click = () -> {
                startSignal.await(); // wszyscy startują w tej samej chwili
                return mockMvc.perform(post("/api/events/{id}/participation", eventId)
                                .header("Authorization", bearer(token)))
                        .andReturn().getResponse().getStatus();
            };
            results.add(pool.submit(click));
        }

        startSignal.countDown();

        int success = 0;
        int refused = 0;
        for (Future<Integer> result : results) {
            int code = result.get();
            if (code >= 200 && code < 300) {
                success++;
            } else if (code == 409) {
                refused++;
            }
        }
        pool.shutdown();

        assertThat(success).isEqualTo(capacity);
        assertThat(refused).isEqualTo(people - capacity);

        mockMvc.perform(get("/api/events/{id}", eventId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.participantCount").value(capacity));
    }
}