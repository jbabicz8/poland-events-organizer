package pl.babicz.events_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.babicz.events_backend.model.Event;
import pl.babicz.events_backend.model.EventStatus;

import java.util.List;
import java.util.Optional;

public interface EventRepository
        extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    // Metoda znajduje wydarzenie po ID i jego statusie.
    Optional<Event> findByIdAndStatus(Long id, EventStatus status);

    // Znajdź organizatora po jego ID i posortuj według daty utworzenia w kolejności malejącej.
    List<Event> findByOrganizerIdOrderByCreatedAtDesc(Long organizerId);

    // Znajdź wydarzenia po statusie i posortuj według daty utworzenia w kolejności rosnącej.
    List<Event> findByStatusOrderByCreatedAtAsc(EventStatus status);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
        update Event e
        set e.participantCount = e.participantCount + 1
        where e.id = :id
          and (e.capacity is null or e.participantCount < e.capacity)
        """)
    int incrementParticipants(@Param("id") Long id);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Event e set e.participantCount = e.participantCount - 1 where e.id = :id and e.participantCount > 0")
    void decrementParticipants(@Param("id") Long id);
}
