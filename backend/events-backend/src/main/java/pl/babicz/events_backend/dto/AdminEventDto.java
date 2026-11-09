package pl.babicz.events_backend.dto;

import pl.babicz.events_backend.model.EventStatus;

import java.time.LocalDateTime;
import java.util.List;

public record AdminEventDto(
        Long id,
        String title,
        String description,
        LocalDateTime startDate,
        LocalDateTime endDate,
        String city,
        String address,
        String voivodeship,
        List<String> categories,
        String organizer,
        EventStatus status,
        String rejectionReason,
        LocalDateTime createdAt
) {
}
