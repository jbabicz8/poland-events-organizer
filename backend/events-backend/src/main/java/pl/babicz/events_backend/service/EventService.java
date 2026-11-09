package pl.babicz.events_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pl.babicz.events_backend.dto.EventDto;
import pl.babicz.events_backend.dto.EventFilter;
import pl.babicz.events_backend.dto.EventRequest;
import pl.babicz.events_backend.dto.MyEventDto;
import pl.babicz.events_backend.model.*;
import pl.babicz.events_backend.repository.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final AppUserRepository userRepository;
    private final VoivodeshipRepository voivodeshipRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public Page<EventDto> search(EventFilter filter, Pageable pageable) {
        Specification<Event> spec = Specification.allOf(List.of(
                EventSpecifications.hasStatus(EventStatus.APPROVED),
                EventSpecifications.inVoivodeship(filter.voivodeshipId()),
                EventSpecifications.inCategory(filter.categoryId()),
                EventSpecifications.titleContains(filter.query()),
                EventSpecifications.startsFrom(filter.from()),
                EventSpecifications.startsUntil(filter.to())
        ));
        return eventRepository.findAll(spec, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public EventDto getApprovedEvent(Long id) {
        Event event = eventRepository.findByIdAndStatus(id, EventStatus.APPROVED)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Nie znaleziono wydarzenia"));
        return toDto(event);
    }

    @Transactional
    public MyEventDto create(String organizerEmail, EventRequest request) {
        AppUser organizer = findUser(organizerEmail);

        Event event = new Event();
        applyRequest(event, request);
        event.setOrganizer(organizer);
        event.setStatus(EventStatus.PENDING);
        event.setCheckinCount(0);
        event.setCreatedAt(LocalDateTime.now());

        eventRepository.save(event);
        return toMyDto(event);
    }

    @Transactional
    public MyEventDto update (Long id, String organizerEmail, EventRequest request) {
        AppUser organizer = findUser(organizerEmail);

        Event event = eventRepository.findById(id)
                .filter(e -> e.getOrganizer() != null
                && e.getOrganizer().getId().equals(organizer.getId()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Nie znaleziono wydarzenia"));

        if (event.getStatus() == EventStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Zatwierdzonego wydarzenia nie można edytować");
        }
        applyRequest(event, request);
        event.setStatus(EventStatus.PENDING);
        event.setRejectionReason(null);
        event.setModerator(null);
        event.setUpdatedAt(LocalDateTime.now());

        return toMyDto(event);
    }

    void applyRequest(Event event, EventRequest request) {
        if (request.endDate() != null  && request.endDate().isBefore(request.startDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia");
        }

        Voivodeship voivodeship = voivodeshipRepository.findById(request.voivodeshipId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Nie znaleziono województwa"));

        List<Category> categories = categoryRepository.findAllById(request.categoryIds());
        if (categories.size() != request.categoryIds().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Nieznana kategoria");
        }

        event.setTitle(request.title().trim());
        event.setDescription(request.description());
        event.setStartDate(request.startDate());
        event.setEndDate(request.endDate());
        event.setCity(request.city().trim());
        event.setAddress(request.address());
        event.setVoivodeship(voivodeship);
        event.setCategories(new HashSet<>(categories));
    }

    @Transactional(readOnly = true)
    public List<MyEventDto> getMine(String organizerEmail) {
        AppUser organizer = findUser(organizerEmail);
        return eventRepository.findByOrganizerIdOrderByCreatedAtDesc(organizer.getId())
                .stream()
                .map(this::toMyDto)
                .toList();
    }

    private AppUser findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private EventDto toDto(Event e) {
        String organizer = e.getOrganizerName() != null
                ? e.getOrganizerName()
                : (e.getOrganizer() != null ? e.getOrganizer().getDisplayName() : null);

        return new EventDto(
                e.getId(),
                e.getTitle(),
                e.getDescription(),
                e.getStartDate(),
                e.getEndDate(),
                e.getCity(),
                e.getAddress(),
                e.getVoivodeship() != null ? e.getVoivodeship().getName() : null,
                e.getCategories().stream().map(Category::getName).toList(),
                organizer,
                e.getCheckinCount()
        );
    }

    private MyEventDto toMyDto(Event e) {
        return new MyEventDto(
                e.getId(),
                e.getTitle(),
                e.getStartDate(),
                e.getCity(),
                e.getVoivodeship() != null ? e.getVoivodeship().getName() : null,
                e.getCategories().stream().map(Category::getName).toList(),
                e.getStatus(),
                e.getRejectionReason()
        );
    }
}