package pl.babicz.events_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.babicz.events_backend.model.AppUser;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmail(String email);

    boolean existsByEmail(String email);
}
