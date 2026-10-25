package pl.babicz.events_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.babicz.events_backend.model.Voivodeship;

public interface VoivodeshipRepository extends JpaRepository<Voivodeship, Long> {
}
