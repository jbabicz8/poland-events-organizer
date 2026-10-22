package pl.babicz.events_backend.dto;

import java.time.LocalDateTime;
import java.util.List;

// DTO pozwoli na to, żeby nie zwracać encji bezpośrednio, żeby nie zwrócić przez przypadek danych
// które użytkownik nie powinien widzieć np. hasła organizatora.
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
        Integer checkinCount
) {
}
