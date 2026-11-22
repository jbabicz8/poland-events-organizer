package pl.babicz.events_backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "event_image")
@Getter @Setter @NoArgsConstructor
public class EventImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // żeby wiedzieć do jakiego eventu jest przypisane zdjęcie.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id")
    private Event event;

    private String url;

    // pole pozwoli przesuwać zdjęcia dodane do wydarzenia.
    private int sortOrder;
}
