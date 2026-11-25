package pl.babicz.events_backend;

import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class SmokeTest extends AbstractIntegrationTest {

    @Test
    void publicEventListIsAvailable() throws Exception {
        mockMvc.perform(get("/api/events"))
                .andExpect(status().isOk());
    }

    @Test
    void allSixteenVoivodeshipsAreSeededByMigrations() throws Exception {
        mockMvc.perform(get("/api/voivodeships"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(16));
    }
}
