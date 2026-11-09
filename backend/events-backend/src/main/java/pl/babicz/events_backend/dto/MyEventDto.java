package pl.babicz.events_backend.dto;

import pl.babicz.events_backend.model.EventStatus;

import java.time.LocalDateTime;
import java.util.List;

public record MyEventDto(
        Long id,
        String title,
        LocalDateTime startDate,
        String city,
        String voivodeship,
        List<String> categories,
        EventStatus status,
        String rejectionReason
) {
}
