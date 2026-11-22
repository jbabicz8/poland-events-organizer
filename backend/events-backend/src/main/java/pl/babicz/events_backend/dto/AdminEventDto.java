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
        Long voivodeshipId,
        String voivodeship,
        List<Long> categoryIds,
        List<String> categories,
        String organizer,
        EventStatus status,
        String rejectionReason,
        LocalDateTime createdAt,
        Integer capacity,
        Integer participantCount,
        List<ImageDto> images
) {
}