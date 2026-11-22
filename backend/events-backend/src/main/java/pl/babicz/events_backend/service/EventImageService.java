package pl.babicz.events_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import pl.babicz.events_backend.dto.ImageDto;
import pl.babicz.events_backend.model.AppUser;
import pl.babicz.events_backend.model.Event;
import pl.babicz.events_backend.model.EventImage;
import pl.babicz.events_backend.model.EventStatus;
import pl.babicz.events_backend.model.Role;
import pl.babicz.events_backend.repository.AppUserRepository;
import pl.babicz.events_backend.repository.EventImageRepository;
import pl.babicz.events_backend.repository.EventRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventImageService {

    // dozwolona ilość zdjęć do wgrania na jedno wydarzenie.
    private static final int MAX_IMAGES = 7;

    private final EventRepository eventRepository;
    private final EventImageRepository imageRepository;
    private final AppUserRepository userRepository;
    private final ImageStorageService storage;

    @Transactional
    public ImageDto add(Long eventId, String email, MultipartFile file) {
        Event event = findEditableEvent(eventId, email);

        if (event.getImages().size() >= MAX_IMAGES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Wydarzenie może mieć maksymalnie " + MAX_IMAGES + "zdjęć");
        }

        String filename = storage.store(file);

        EventImage image = new EventImage();
        image.setEvent(event);
        image.setUrl("/api/images/" + filename);
        image.setSortOrder(
                event.getImages().stream().mapToInt(EventImage::getSortOrder).max().orElse(-1) + 1);
        imageRepository.save(image);
        event.getImages().add(image);

        return new ImageDto(image.getId(), image.getUrl());
    }

    @Transactional
    public void remove(Long eventId, Long imageId, String email) {
        Event event = findEditableEvent(eventId, email);

        EventImage image = event.getImages().stream()
                .filter(i -> i.getId().equals(imageId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Nie znaleziono zdjęcia"));

        event.getImages().remove(image);
        storage.deleteByUrl(image.getUrl());
    }

    @Transactional
    public List<ImageDto> reorder(Long eventId, String email, List<Long> imageIds) {
        Event event = findEditableEvent(eventId, email);

        Map<Long, EventImage> byId = event.getImages().stream()
                .collect(Collectors.toMap(EventImage::getId, image -> image));

        // Lista musi zawierać dokładnie wszystkie zdjęcia tego wydarzenia, bez powtórzeń
        boolean valid = imageIds.size() == byId.size()
                && new HashSet<>(imageIds).size() == imageIds.size()
                && byId.keySet().containsAll(imageIds);
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nieprawidłowa lista zdjęć");
        }

        for (int i = 0; i < imageIds.size(); i++) {
            byId.get(imageIds.get(i)).setSortOrder(i);
        }

        return imageIds.stream()
                .map(byId::get)
                .map(image -> new ImageDto(image.getId(), image.getUrl()))
                .toList();
    }

    // Administrator zmienia zdjęcia dowolnego wydarzenia. Organizator tylko własnego, niezatwierdzonego.
    private Event findEditableEvent(Long eventId, String email) {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Nie znaleziono wydarzenia"));

        if (user.getRoleName() != Role.ADMIN) {
            boolean owner = event.getOrganizer() != null
                    && event.getOrganizer().getId().equals(user.getId());
            if (!owner) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono wydarzenia");
            }
            if (event.getStatus() == EventStatus.APPROVED) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Zdjęć zatwierdzonego wydarzenia nie można zmieniać");
            }
        }
        return event;
    }
}
