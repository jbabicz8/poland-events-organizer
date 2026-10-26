package pl.babicz.events_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pl.babicz.events_backend.config.JwtService;
import pl.babicz.events_backend.dto.AuthResponse;
import pl.babicz.events_backend.dto.LoginRequest;
import pl.babicz.events_backend.dto.RegisterRequest;
import pl.babicz.events_backend.model.AppUser;
import pl.babicz.events_backend.model.Role;
import pl.babicz.events_backend.repository.AppUserRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register (RegisterRequest request) {
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Konto z takim adresem e-mail już istnieje");
        }

        AppUser user = new AppUser();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.displayName());
        user.setRoleName(request.asOrganizer() ? Role.ORGANIZER : Role.USER);
        user.setCreatedAt(LocalDateTime.now());
        userRepository.save(user);

        return toResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();

        AppUser user = userRepository.findByEmail(email)
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Nieprawidłowy e-mail lub hasło"));

        return toResponse(user);
    }

    private AuthResponse toResponse(AppUser user) {
        return new AuthResponse(
                jwtService.generateToken(user),
                user.getEmail(),
                user.getDisplayName(),
                user.getRoleName().name()
        );
    }
}
