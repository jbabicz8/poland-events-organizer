package pl.babicz.events_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import pl.babicz.events_backend.model.Event;
import pl.babicz.events_backend.model.EventStatus;

import java.util.Optional;

public interface EventRepository
        extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    // Metoda znajduje wydarzenie po ID i jego statusie.
    Optional<Event> findByIdAndStatus(Long id, EventStatus status);
}
