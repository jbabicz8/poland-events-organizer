package pl.babicz.events_backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.*;
import pl.babicz.events_backend.dto.EventDto;
import pl.babicz.events_backend.dto.EventFilter;
import pl.babicz.events_backend.service.EventService;
import pl.babicz.events_backend.dto.MyEventDto;
import pl.babicz.events_backend.dto.EventRequest;
import pl.babicz.events_backend.service.ParticipationService;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final ParticipationService participationService;

    @GetMapping
    public PagedModel<EventDto> list(
            EventFilter filter,
            @PageableDefault(size = 20, sort = "startDate") Pageable pageable) {
        return new PagedModel<>(eventService.search(filter, pageable));
    }

    @GetMapping("/{id}")
    public EventDto details(@PathVariable Long id) {
        return eventService.getApprovedEvent(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MyEventDto create(@Valid @RequestBody EventRequest request,
                             Authentication authentication) {
        return eventService.create(authentication.getName(), request);
    }

    @GetMapping("/mine")
    public List<MyEventDto> mine(Authentication authentication) {
        return eventService.getMine(authentication.getName());
    }

    @PutMapping("/{id}")
    public MyEventDto update(@PathVariable Long id,
                             @Valid @RequestBody EventRequest request,
                             Authentication authentication) {
        return eventService.update(id, authentication.getName(), request);
    }

    @PostMapping("/{id}/participation")
    public EventDto join(@PathVariable Long id, Authentication authentication) {
        return participationService.join(id, authentication.getName());
    }

    @DeleteMapping("/{id}/participation")
    public EventDto leave(@PathVariable Long id, Authentication authentication) {
        return participationService.leave(id, authentication.getName());
    }

    @GetMapping("/participations/mine")
    public List<EventDto> myParticipations(Authentication authentication) {
        return participationService.getMine(authentication.getName());
    }
}
