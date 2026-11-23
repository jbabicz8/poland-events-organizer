package pl.babicz.events_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.List;
import java.util.ArrayList;
import jakarta.persistence.Column;

@Entity
@Getter @Setter @NoArgsConstructor
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tytuł wydarzenia
    private String title;

    // Opis wydarzenia.
    @Column(columnDefinition = "text")
    private String description;

    // Data rozpoczęcia wydarzenia
    private LocalDateTime startDate;

    // Data zakończenia wydarzenia
    private LocalDateTime endDate;

    // Miasto (opcjonalnie po prostu wieś) w którym odbywać się będzie wydarzenie.
    private String city;

    // Adres pod jakim wydarzenie będzie miało miejsce.
    private String address;

    // Status wydarzenia zdefiniowany w enumie (EventStatus)
    @Enumerated(EnumType.STRING)
    private EventStatus status;

    // Powód odrzucenia jeśli taki jest.
    private String rejectionReason;

    // Które konto organizatora jest przypisane do tego wydarzenia
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id")
    private AppUser organizer;

    // Nazwa organizatora
    private String organizerName;

    // Moderator id, który moderator jest przypisany do tego wydarzenia.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moderator_id")
    private AppUser moderator;

    // Które województwo (po ID) należy do tego wydarzenia, tzn które jest przypisane
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voivodeship_id")
    private Voivodeship voivodeship;

    // Możemy posiadać kilka kategorii przypisanych do jednego wydarzenia.
    @ManyToMany
    @JoinTable(
            name="event_category",
            joinColumns = @JoinColumn(name = "event_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private Set<Category> categories = new HashSet<>();

    // Kiedy zostało wydarzenie stworzone.
    private LocalDateTime createdAt;

    // Kiedy zostało wydarzenie zmodyfikowane.
    private LocalDateTime updatedAt;

    // Przechowywanie liczby zameldowań.
    private Integer participantCount;

    private Integer capacity;

    @Column(name = "website_url", length = 500)
    private String websiteUrl;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    private List<EventImage> images = new ArrayList<>();
}
