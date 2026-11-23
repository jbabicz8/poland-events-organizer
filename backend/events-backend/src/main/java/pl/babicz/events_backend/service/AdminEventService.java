package pl.babicz.events_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pl.babicz.events_backend.dto.AdminEventDto;
import pl.babicz.events_backend.dto.AdminEventRequest;
import pl.babicz.events_backend.dto.EventRequest;
import pl.babicz.events_backend.model.AppUser;
import pl.babicz.events_backend.model.Category;
import pl.babicz.events_backend.model.Event;
import pl.babicz.events_backend.model.EventStatus;
import pl.babicz.events_backend.repository.AppUserRepository;
import pl.babicz.events_backend.repository.EventRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminEventService {

    private final EventRepository eventRepository;
    private final AppUserRepository userRepository;
    private final EventService eventService;
    private final ImageStorageService imageStorage;

    @Transactional(readOnly = true)
    public List<AdminEventDto> getPending() {
        return eventRepository.findByStatusOrderByCreatedAtAsc(EventStatus.PENDING)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public AdminEventDto approve(Long id, String adminEmail) {
        Event event = findPending(id);
        event.setStatus(EventStatus.APPROVED);
        event.setRejectionReason(null);
        event.setModerator(findUser(adminEmail));
        event.setUpdatedAt(LocalDateTime.now());
        return toDto(event);
    }

    @Transactional
    public AdminEventDto reject(Long id, String reason, String adminEmail) {
        Event event = findPending(id);
        event.setStatus(EventStatus.REJECTED);
        event.setRejectionReason(reason.trim());
        event.setModerator(findUser(adminEmail));
        event.setUpdatedAt(LocalDateTime.now());
        return toDto(event);
    }

    @Transactional
    public AdminEventDto update(Long id, EventRequest request) {
        Event event = findEvent(id);
        eventService.applyRequest(event, request);
        event.setUpdatedAt(LocalDateTime.now());
        return toDto(event);
    }

    @Transactional
    public void delete(Long id) {
        Event event = findEvent(id);
        event.getImages().forEach(image -> imageStorage.deleteByUrl(image.getUrl()));
        eventRepository.delete(event);
    }

    @Transactional
    public AdminEventDto create(String adminEmail, AdminEventRequest request) {
        Event event = new Event();
        eventService.applyRequest(event, request.event());
        event.setOrganizerName(request.organizerName().trim());
        event.setModerator(findUser(adminEmail));
        event.setStatus(EventStatus.APPROVED);
        event.setParticipantCount(0);
        event.setCreatedAt(LocalDateTime.now());

        eventRepository.save(event);
        return toDto(event);
    }

    private Event findEvent(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Nie znaleziono wydarzenia"));
    }

    private Event findPending(Long id) {
        Event event = findEvent(id);
        if (event.getStatus() != EventStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "To wydarzenie nie oczekuje na weryfikację");
        }
        return event;
    }

    private AppUser findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED));
    }

    @Transactional(readOnly = true)
    public List<AdminEventDto> getAll() {
        return eventRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::toDto)
                .toList();
    }

    private AdminEventDto toDto(Event e) {
        String organizer = e.getOrganizerName();
        if (organizer == null && e.getOrganizer() != null) {
            AppUser o = e.getOrganizer();
            organizer = o.getDisplayName() != null
                    ? o.getDisplayName() + " (" + o.getEmail() + ")"
                    : o.getEmail();
        }

        return new AdminEventDto(
                e.getId(),
                e.getTitle(),
                e.getDescription(),
                e.getStartDate(),
                e.getEndDate(),
                e.getCity(),
                e.getAddress(),
                e.getVoivodeship() != null ? e.getVoivodeship().getId() : null,
                e.getVoivodeship() != null ? e.getVoivodeship().getName() : null,
                e.getCategories().stream().map(Category::getId).toList(),
                e.getCategories().stream().map(Category::getName).toList(),
                organizer,
                e.getStatus(),
                e.getRejectionReason(),
                e.getCreatedAt(),
                e.getCapacity(),
                e.getParticipantCount(),
                eventService.toImageDtos(e),
                e.getWebsiteUrl()
        );
    }
}
