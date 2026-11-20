package pl.babicz.events_backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record EventDto(
        Long id,
        String title,
        String description,
        LocalDateTime startDate,
        LocalDateTime endDate,
        String city,
        String address,
        String voivodeship,
        List<String> categories,
        String organizerName,
        Integer participantCount,
        Integer capacity
) {
}