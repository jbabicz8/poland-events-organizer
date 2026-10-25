package pl.babicz.events_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.babicz.events_backend.dto.EventDto;
import pl.babicz.events_backend.model.Category;
import pl.babicz.events_backend.model.Event;
import pl.babicz.events_backend.model.EventStatus;
import pl.babicz.events_backend.repository.EventRepository;
import pl.babicz.events_backend.dto.EventFilter;
import pl.babicz.events_backend.repository.EventSpecifications;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.data.jpa.domain.Specification;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    // Metoda zwraca tylko Event po ID.
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
}
