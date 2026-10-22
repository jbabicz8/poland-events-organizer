package pl.babicz.events_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_user")
@Getter @Setter @NoArgsConstructor
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;

    private String passwordHash;

    private String displayName;

    @Enumerated(EnumType.STRING) // Zastosowałem typ wyliczeniowy ENUM do przypisania roli.
    private Role roleName;

    private LocalDateTime createdAt;
}
