package pl.babicz.events_backend.repository;

import org.springframework.data.jpa.domain.Specification;
import pl.babicz.events_backend.model.Event;
import pl.babicz.events_backend.model.EventStatus;

import java.time.LocalDate;

public class EventSpecifications {

    public static Specification<Event> hasStatus(EventStatus status) {
        return (root, query, cb) ->
                cb.equal(root.get("status"), status);
    }

    public static Specification<Event> inVoivodeship(Long id) {
        if (id == null) return all();
        return (root, query, cb) ->
                cb.equal(root.get("voivodeship").get("id"), id);
    }

    public static Specification<Event> inCategory(Long id) {
        if (id == null) return all();
        return (root, query, cb) ->
                cb.equal(root.join("categories").get("id"), id);
    }

    public static Specification<Event> titleContains(String text) {
        if (text == null || text.isBlank()) return all();
        String pattern = "%" + text.trim().toLowerCase() + "%";
        return (root, query, cb) ->
                cb.like(cb.lower(root.get("title")), pattern);
    }

    public static Specification<Event> startsFrom(LocalDate from) {
        if (from == null) return all();
        return (root, query, cb) ->
                cb.greaterThanOrEqualTo(root.get("startDate"), from.atStartOfDay());
    }

    public static Specification<Event> startsUntil(LocalDate to) {
        if (to == null) return all();
        return (root, query, cb) ->
                cb.lessThan(root.get("startDate"), to.plusDays(1).atStartOfDay());
    }

    private static Specification<Event> all() {
        return (root, query, cb) -> cb.conjunction();
    }
}
