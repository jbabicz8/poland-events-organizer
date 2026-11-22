package pl.babicz.events_backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import pl.babicz.events_backend.dto.ImageDto;
import pl.babicz.events_backend.dto.ImageOrderRequest;
import pl.babicz.events_backend.service.EventImageService;
import pl.babicz.events_backend.service.ImageStorageService;

import java.time.Duration;
import java.util.List;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ImageController {

    // Tylko nazwy w takim kształcie, jakie sami nadajemy (uuid + rozszerzenie)
    private static final Pattern FILENAME = Pattern.compile("^[0-9a-f-]{36}\\.(jpg|png|webp)$");

    private final EventImageService imageService;
    private final ImageStorageService storage;

    @PostMapping("/events/{eventId}/images")
    @ResponseStatus(HttpStatus.CREATED)
    public ImageDto upload(@PathVariable Long eventId,
                           @RequestParam("file") MultipartFile file,
                           Authentication authentication) {
        return imageService.add(eventId, authentication.getName(), file);
    }

    @DeleteMapping("/events/{eventId}/images/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long eventId,
                       @PathVariable Long imageId,
                       Authentication authentication) {
        imageService.remove(eventId, imageId, authentication.getName());
    }

    @GetMapping("/images/{filename}")
    public ResponseEntity<Resource> get(@PathVariable String filename) {
        if (!FILENAME.matcher(filename).matches()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono zdjęcia");
        }

        MediaType type = filename.endsWith(".png")
                ? MediaType.IMAGE_PNG
                : filename.endsWith(".webp")
                    ? MediaType.parseMediaType("image/webp")
                    : MediaType.IMAGE_JPEG;

        return ResponseEntity.ok()
                .contentType(type)
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                .body(storage.load(filename));
    }

    @PutMapping("/events/{eventId}/images/order")
    public List<ImageDto> reorder(@PathVariable Long eventId,
                                  @Valid @RequestBody ImageOrderRequest request,
                                  Authentication authentication) {
        return imageService.reorder(eventId, authentication.getName(), request.imageIds());
    }
}
