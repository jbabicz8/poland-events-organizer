package pl.babicz.events_backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.babicz.events_backend.dto.CategoryDto;
import pl.babicz.events_backend.dto.CategoryRequest;
import pl.babicz.events_backend.service.AdminCategoryService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final AdminCategoryService adminCategoryService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryDto create(@Valid @RequestBody CategoryRequest request) {
        return adminCategoryService.create(request);
    }

    @PutMapping("/{id}")
    public CategoryDto update(@PathVariable Long id,
                              @Valid @RequestBody CategoryRequest request) {
        return adminCategoryService.update(id, request);
    }

    @GetMapping
    public List<CategoryDto> all() {
        return adminCategoryService.getAll();
    }
}
