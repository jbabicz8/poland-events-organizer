package pl.babicz.events_backend.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.babicz.events_backend.dto.LookupDto;
import pl.babicz.events_backend.dto.VoivodeshipDto;
import pl.babicz.events_backend.repository.CategoryRepository;
import pl.babicz.events_backend.repository.VoivodeshipRepository;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LookupController {

    private final VoivodeshipRepository voivodeshipRepository;
    private final CategoryRepository categoryRepository;

    @GetMapping("/voivodeships")
    public List<VoivodeshipDto> voivodeships() {
        return voivodeshipRepository.findAll(Sort.by("name")).stream()
                .map(v -> new VoivodeshipDto(v.getId(), v.getName(), v.getMapCode()))
                .toList();
    }

    @GetMapping("/categories")
    public List<LookupDto> categories() {
        return categoryRepository.findAll(Sort.by("name")).stream()
                .map(c -> new LookupDto(c.getId(), c.getName()))
                .toList();
    }
}
