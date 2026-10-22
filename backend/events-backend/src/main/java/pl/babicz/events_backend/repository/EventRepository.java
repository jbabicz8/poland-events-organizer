package pl.babicz.events_backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.babicz.events_backend.model.Event;
import pl.babicz.events_backend.model.EventStatus;

public interface EventRepository extends JpaRepository<Event, Long> {

    // Metoda pozwala na znalezienie eventu po statusie, pageable dodaje od razu stronicowanie do sortowania.
    Page<Event> findByStatus(EventStatus status, Pageable pageable);
}
