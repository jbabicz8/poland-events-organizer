package pl.babicz.events_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.babicz.events_backend.model.Category;

public interface CategoryRepository extends JpaRepository<Category, Long>{
}
