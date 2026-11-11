package pl.babicz.events_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pl.babicz.events_backend.dto.CategoryDto;
import pl.babicz.events_backend.dto.CategoryRequest;
import pl.babicz.events_backend.model.Category;
import pl.babicz.events_backend.repository.CategoryRepository;

@Service
@RequiredArgsConstructor
public class AdminCategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional
    public CategoryDto create(CategoryRequest request) {
        String name = request.name().trim();
        checkNameFree(name, null);

        Category category = new Category();
        category.setName(name);
        category.setDescription(request.description());
        categoryRepository.save(category);

        return toDto(category);
    }

    @Transactional
    public CategoryDto update(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Nie znaleziono takiej kategorii" ));

        String name = request.name().trim();
        checkNameFree(name, id);

        category.setName(name);
        category.setDescription(request.description());
        return toDto(category);
    }

    // Nazwa nie może się powtarzać, dlatego potrzebuje zaimplementować metodę sprawdzającą.
    private void checkNameFree(String name, Long ownId) {
        categoryRepository.findByNameIgnoreCase(name)
                .filter(c -> !c.getId().equals(ownId))
                .ifPresent(c -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT, "Kategoria o takiej nazwie już istnieje"
                    );
                });
    }

    private CategoryDto toDto(Category c) {
        return new CategoryDto(c.getId(), c.getName(), c.getDescription());
    }
}
