package pl.babicz.events_backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pl.babicz.events_backend.model.AppUser;
import pl.babicz.events_backend.model.PasswordResetToken;
import pl.babicz.events_backend.repository.AppUserRepository;
import pl.babicz.events_backend.repository.PasswordResetTokenRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final long VALID_MINUTES = 60;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AppUserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.mail.from}")
    private String mailFrom;

    // Nic nie zwraca i nie zdradza, czy konto istnieje
    @Transactional
    public void requestReset(String email) {
        userRepository.findByEmail(email.trim().toLowerCase()).ifPresent(user -> {
            tokenRepository.deleteByUser(user); // stare linki przestają działać

            String token = generateToken();

            PasswordResetToken entity = new PasswordResetToken();
            entity.setUser(user);
            entity.setTokenHash(hash(token));
            entity.setExpiresAt(LocalDateTime.now().plusMinutes(VALID_MINUTES));
            entity.setCreatedAt(LocalDateTime.now());
            tokenRepository.save(entity);

            sendMail(user, token);
        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken entity = tokenRepository.findByTokenHash(hash(token))
                .filter(t -> !t.isUsed() && t.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Link jest nieprawidłowy lub wygasł"));

        entity.getUser().setPasswordHash(passwordEncoder.encode(newPassword));
        entity.setUsed(true);
    }

    private void sendMail(AppUser user, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(user.getEmail());
            message.setSubject("Odzyskiwanie hasła");
            message.setText(
                    "Aby ustawić nowe hasło, kliknij w link (ważny " + VALID_MINUTES + " minut):\n\n"
                            + frontendUrl + "/?reset=" + token
                            + "\n\nJeśli to nie Ty prosiłeś o zmianę hasła, zignoruj tę wiadomość.");
            mailSender.send(message);
        } catch (MailException e) {
            // Błąd poczty nie może zdradzić, że konto istnieje, więc tylko go zapisujemy w logach
            log.error("Nie udało się wysłać e-maila z linkiem do zmiany hasła", e);
        }
    }

    // Losowy, trudny do odgadnięcia ciąg znaków (32 losowe bajty)
    private String generateToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}