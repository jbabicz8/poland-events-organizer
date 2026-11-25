package pl.babicz.events_backend;

import com.jayway.jsonpath.JsonPath;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.upload-dir=target/test-uploads")
@AutoConfigureMockMvc
@Import(TestcontainersConfig.class)
public abstract class AbstractIntegrationTest {

    protected static final String PASSWORD = "haslo1234";
    protected static final String ADMIN_EMAIL = "test-admin@test.pl";
    protected static final String ADMIN_PASSWORD = "Admin12345";

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    /** Unikalny e-mail, żeby testy nie wchodziły sobie w drogę (baza jest wspólna). */
    protected String uniqueEmail(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8) + "@test.pl";
    }

    /** Zakłada konto (uczestnika albo organizatora) i zwraca jego token JWT. */
    protected String registerAndGetToken(String email, boolean organizer) throws Exception {
        String body = """
                {"email":"%s","password":"%s","displayName":"Test","asOrganizer":%s}
                """.formatted(email, PASSWORD, organizer);

        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return JsonPath.read(response, "$.token");
    }

    /** Zakłada (jeśli trzeba) administratora testowego w bazie i zwraca jego token. */
    protected String adminToken() throws Exception {
        Integer exists = jdbcTemplate.queryForObject(
                "select count(*) from app_user where email = ?", Integer.class, ADMIN_EMAIL);
        if (exists == null || exists == 0) {
            jdbcTemplate.update(
                    "insert into app_user (email, password_hash, display_name, role_name, created_at) "
                            + "values (?, ?, ?, ?, now())",
                    ADMIN_EMAIL, passwordEncoder.encode(ADMIN_PASSWORD), "Administrator", "ADMIN");
        }

        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + ADMIN_PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return JsonPath.read(response, "$.token");
    }

    protected String bearer(String token) {
        return "Bearer " + token;
    }
}