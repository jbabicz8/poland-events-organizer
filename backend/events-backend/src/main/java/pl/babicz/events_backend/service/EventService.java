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

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    // Metoda zwraca tylko zaakceptowane wydarzenia.
    @Transactional(readOnly = true)
    public Page<EventDto> getApprovedEvents(Pageable pageable) {
        return eventRepository.findByStatus(EventStatus.APPROVED, pageable)
                .map(this::toDto);
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
