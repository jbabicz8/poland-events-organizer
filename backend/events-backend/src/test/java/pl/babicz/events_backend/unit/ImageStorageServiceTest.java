package pl.babicz.events_backend.unit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import pl.babicz.events_backend.service.ImageStorageService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ImageStorageServiceTest {

    @TempDir
    Path tempDir;

    private Path uploads;
    private ImageStorageService service;

    @BeforeEach
    void setUp() {
        uploads = tempDir.resolve("uploads");
        service = new ImageStorageService(uploads.toString());
    }

    // ---- pliki o poprawnych nagłówkach ----

    private static byte[] jpeg(int size) {
        byte[] b = new byte[size];
        b[0] = (byte) 0xFF;
        b[1] = (byte) 0xD8;
        b[2] = (byte) 0xFF;
        return b;
    }

    private static byte[] png() {
        byte[] b = new byte[64];
        byte[] header = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
        System.arraycopy(header, 0, b, 0, header.length);
        return b;
    }

    private static byte[] webp() {
        byte[] b = new byte[64];
        byte[] riff = "RIFF".getBytes(StandardCharsets.US_ASCII);
        byte[] webp = "WEBP".getBytes(StandardCharsets.US_ASCII);
        System.arraycopy(riff, 0, b, 0, 4);
        System.arraycopy(webp, 0, b, 8, 4);
        return b;
    }

    private MockMultipartFile file(String name, byte[] content) {
        return new MockMultipartFile("file", name, "application/octet-stream", content);
    }

    private void assertBadRequest(Runnable action) {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, action::run);
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    @DisplayName("Poprawny JPG jest zapisywany pod losową nazwą z rozszerzeniem .jpg")
    void storesJpeg() {
        String name = service.store(file("wakacje.jpg", jpeg(1024)));

        assertThat(name).endsWith(".jpg").doesNotContain("wakacje");
        assertThat(Files.exists(uploads.resolve(name))).isTrue();
    }

    @Test
    @DisplayName("Poprawny PNG jest zapisywany")
    void storesPng() {
        assertThat(service.store(file("a.png", png()))).endsWith(".png");
    }

    @Test
    @DisplayName("Poprawny WebP jest zapisywany")
    void storesWebp() {
        assertThat(service.store(file("a.webp", webp()))).endsWith(".webp");
    }

    @Test
    @DisplayName("Zdjęcie o rozmiarze kilku MB (typowe z telefonu) jest akceptowane")
    void acceptsPhoneSizedPhoto() {
        String name = service.store(file("iphone.jpg", jpeg(5 * 1024 * 1024)));

        assertThat(Files.exists(uploads.resolve(name))).isTrue();
    }

    @Test
    @DisplayName("Plik większy niż 10 MB jest odrzucany")
    void rejectsTooLargeFile() {
        assertBadRequest(() -> service.store(file("duze.jpg", jpeg(10 * 1024 * 1024 + 1))));
    }

    @Test
    @DisplayName("Plik tekstowy z rozszerzeniem .jpg jest odrzucany (sprawdzamy zawartość, nie nazwę)")
    void rejectsFakeImage() {
        byte[] text = "to nie jest obrazek".getBytes(StandardCharsets.UTF_8);

        assertBadRequest(() -> service.store(file("falszywka.jpg", text)));
    }

    @Test
    @DisplayName("Pusty plik jest odrzucany")
    void rejectsEmptyFile() {
        assertBadRequest(() -> service.store(file("pusty.jpg", new byte[0])));
    }

    @Test
    @DisplayName("Próba odczytu pliku spoza folderu zdjęć (../) kończy się 404")
    void loadBlocksPathTraversal() throws IOException {
        Files.writeString(tempDir.resolve("tajny.txt"), "sekret");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.load("../tajny.txt"));

        assertThat(ex.getStatusCode().value()).isEqualTo(404);
    }

    @Test
    @DisplayName("Usunięcie zdjęcia po adresie kasuje plik z dysku")
    void deleteByUrlRemovesFile() {
        String name = service.store(file("a.jpg", jpeg(1024)));

        service.deleteByUrl("/api/images/" + name);

        assertThat(Files.exists(uploads.resolve(name))).isFalse();
    }

    @Test
    @DisplayName("Usuwanie nie ruszy plików spoza folderu zdjęć")
    void deleteByUrlDoesNotTouchOutsideFiles() throws IOException {
        Path secret = tempDir.resolve("tajny.txt");
        Files.writeString(secret, "sekret");

        service.deleteByUrl("/api/images/../tajny.txt");

        assertThat(Files.exists(secret)).isTrue();
    }
}