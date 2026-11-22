package pl.babicz.events_backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ImageOrderRequest(
        @NotNull @Size(max = 20) List<Long> imageIds
) {
}