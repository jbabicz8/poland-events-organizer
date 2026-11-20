package pl.babicz.events_backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Set;

public record EventRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 5000) String description,
        @NotNull LocalDateTime startDate,
        LocalDateTime endDate,
        @NotBlank @Size(max = 100) String city,
        @Size(max = 255) String address,
        @NotNull Long voivodeshipId,
        @NotEmpty Set<Long> categoryIds,
        @Positive @Max(100000) Integer capacity
) {
}