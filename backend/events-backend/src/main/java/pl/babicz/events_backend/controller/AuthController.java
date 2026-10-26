package pl.babicz.events_backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pl.babicz.events_backend.dto.AuthResponse;
import pl.babicz.events_backend.dto.LoginRequest;
import pl.babicz.events_backend.dto.RegisterRequest;
import pl.babicz.events_backend.service.AuthService;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    // Tymczasowy adres do sprawdzania, czy token działa
    @GetMapping("/me")
    public Map<String, String> me(Authentication authentication) {
        return Map.of(
                "email", authentication.getName(),
                "authorities", authentication.getAuthorities().toString()
        );
    }
}
