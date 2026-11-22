package pl.babicz.events_backend.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.coyote.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Slf4j
@Service
public class ImageStorageService {

    private static final long MAX_SIZE = 10 * 1024 * 1024;

    private final Path root;

    public ImageStorageService(@Value("${app.upload-dir}") String uploadDir) {
        this.root = Path.of(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Nie można utworzyć folderu na zdjęcia: " + root, e);
        }
    }

    // zapisuje plik pod losową nazwą i zwraca tę nazwę.
    public String store(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Plik jest pusty");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Zdjęcie może mieć maksymalnie 10MB");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nie udało się odczytać pliku");
        }

        String extension = detectExtension(bytes);
        if (extension == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Dozwolone formaty zdjęć: JPG, PNG i WebP");
        }

        String filename = UUID.randomUUID() + "." + extension;
        try {
            Files.write(root.resolve(filename), bytes);
        } catch (IOException e) {
            throw new IllegalStateException("Nie udało się zapisać zdjęcia", e);
        }
        return filename;
    }

    public Resource load(String filename) {
        Path file = root.resolve(filename).normalize();
        if (!file.startsWith(root) || !Files.isRegularFile(file)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono zdjęcia");
        }
        return new FileSystemResource(file);
    }

    // Usuwa plik na podstawie adresu zapisanego w bazie np. /api/images/abc.jpg
    public void deleteByUrl(String url) {
        String filename = url.substring(url.lastIndexOf('/') + 1);
        Path file = root.resolve(filename).normalize();
        if (!file.startsWith(root)) {
            return;
        }
        try {
            Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("Nie udało się usunąć pliku {}", file, e);
        }
    }

    // rozpoznaje format po pierwszych bajtach pliku, a nie po rozszerzeniu np. .jpg
    private String detectExtension(byte[] b) {
        if (b.length >= 3
                && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (b.length >= 8
                && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return "png";
        }
        if (b.length >= 12
                && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "webp";
        }
        return null;
    }
}
