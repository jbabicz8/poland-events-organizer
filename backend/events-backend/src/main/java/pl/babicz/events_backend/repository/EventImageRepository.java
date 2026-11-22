package pl.babicz.events_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.babicz.events_backend.model.EventImage;

public interface EventImageRepository extends JpaRepository<EventImage, Long> {
}
