package pl.babicz.events_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.babicz.events_backend.model.Participation;

import java.util.List;
import java.util.Optional;

public interface ParticipationRepository extends JpaRepository<Participation, Long> {

    boolean existsByUserIdAndEventId(Long userId, Long eventId);

    Optional<Participation> findByUserIdAndEventId(Long userId, Long eventId);

    List<Participation> findByUserIdOrderByCreatedAtDesc(Long userId);
}