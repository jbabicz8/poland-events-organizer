package pl.babicz.events_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.babicz.events_backend.dto.EventDto;
import pl.babicz.events_backend.dto.EventFilter;
import pl.babicz.events_backend.service.EventService;

import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public PagedModel<EventDto> list(
            EventFilter filter,
            @PageableDefault(size = 20, sort = "startDate") Pageable pageable) {
        return new PagedModel<>(eventService.search(filter, pageable));
    }

}
