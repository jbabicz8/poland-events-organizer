package pl.babicz.events_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pl.babicz.events_backend.dto.EventDto;
import pl.babicz.events_backend.model.AppUser;
import pl.babicz.events_backend.model.Event;
import pl.babicz.events_backend.model.EventStatus;
import pl.babicz.events_backend.model.Participation;
import pl.babicz.events_backend.repository.AppUserRepository;
import pl.babicz.events_backend.repository.EventRepository;
import pl.babicz.events_backend.repository.ParticipationRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ParticipationService {

    private final ParticipationRepository participationRepository;
    private final EventRepository eventRepository;
    private final AppUserRepository userRepository;
    private final EventService eventService;

    @Transactional
    public EventDto join(Long eventId, String email) {
        AppUser user = findUser(email);
        Event event = findApprovedEvent(eventId);
        ensureNotStarted(event);

        if (participationRepository.existsByUserIdAndEventId(user.getId(), eventId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Już zadeklarowałeś udział w tym wydarzeniu");
        }

        Participation participation = new Participation();
        participation.setUser(user);
        participation.setEvent(event);
        participation.setCreatedAt(LocalDateTime.now());
        participationRepository.save(participation);

        int updated = eventRepository.incrementParticipants(eventId);
        if (updated == 0) {
            // Brak wolnych miejsc: wyjątek cofa też zapisany wyżej wiersz participation
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Brak wolnych miejsc");
        }
        return eventService.getApprovedEvent(eventId);
    }

    @Transactional
    public EventDto leave(Long eventId, String email) {
        AppUser user = findUser(email);
        Event event = findApprovedEvent(eventId);
        ensureNotStarted(event);

        Participation participation = participationRepository
                .findByUserIdAndEventId(user.getId(), eventId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Nie deklarowałeś udziału w tym wydarzeniu"));

        participationRepository.delete(participation);
        eventRepository.decrementParticipants(eventId);
        return eventService.getApprovedEvent(eventId);
    }

    @Transactional(readOnly = true)
    public List<EventDto> getMine(String email) {
        AppUser user = findUser(email);
        return participationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(Participation::getEvent)
                .map(eventService::toDto)
                .toList();
    }

    private Event findApprovedEvent(Long eventId) {
        return eventRepository.findByIdAndStatus(eventId, EventStatus.APPROVED)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Nie znaleziono wydarzenia"));
    }

    // Lista chętnych zamyka się w chwili rozpoczęcia wydarzenia
    private void ensureNotStarted(Event event) {
        if (!LocalDateTime.now().isBefore(event.getStartDate())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Wydarzenie już się rozpoczęło, nie można zmienić deklaracji udziału");
        }
    }

    private AppUser findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
}