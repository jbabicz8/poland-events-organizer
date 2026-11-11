package pl.babicz.events_backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;
import pl.babicz.events_backend.dto.AdminEventRequest;
import pl.babicz.events_backend.dto.EventRequest;
import pl.babicz.events_backend.dto.AdminEventDto;
import pl.babicz.events_backend.dto.RejectRequest;
import pl.babicz.events_backend.service.AdminEventService;

import java.util.List;

@RestController
@RequestMapping("api/admin/events")
@RequiredArgsConstructor
public class AdminEventController {

    private final AdminEventService adminEventService;

    @GetMapping("/pending")
    public List<AdminEventDto> pending() {
        return adminEventService.getPending();
    }

    @PostMapping("/{id}/approve")
    public AdminEventDto approve(@PathVariable Long id, Authentication authentication) {
        return adminEventService.approve(id, authentication.getName());
    }

    @PostMapping("/{id}/reject")
    public AdminEventDto reject(@PathVariable Long id,
                                @Valid @RequestBody RejectRequest request,
                                Authentication authentication) {
        return adminEventService.reject(id, request.reason(), authentication.getName());
    }

    @PutMapping("/{id}")
    public AdminEventDto update(@PathVariable Long id,
                                @Valid @RequestBody EventRequest request) {
        return adminEventService.update(id, request);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminEventDto create (@Valid @RequestBody AdminEventRequest request,
                                 Authentication authentication) {
        return adminEventService.create(authentication.getName(), request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        adminEventService.delete(id);
    }
}
