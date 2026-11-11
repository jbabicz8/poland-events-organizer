package pl.babicz.events_backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminEventRequest(
        @NotBlank @Size(max = 255) String organizerName,
        @Valid @NotNull EventRequest event
) {
}
