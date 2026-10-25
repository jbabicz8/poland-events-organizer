package pl.babicz.events_backend.dto;

import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

public record EventFilter(
        Long voivodeshipId,
        Long categoryId,
        String query,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
) {
}
