CREATE TABLE app_user (
                          id            BIGSERIAL PRIMARY KEY,
                          email         VARCHAR(255) NOT NULL UNIQUE,
                          password_hash VARCHAR(255) NOT NULL,
                          display_name  VARCHAR(100),
                          role_name     VARCHAR(20)  NOT NULL,
                          created_at    TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE category (
                          id          BIGSERIAL PRIMARY KEY,
                          name        VARCHAR(100) NOT NULL UNIQUE,
                          description VARCHAR(500)
);

CREATE TABLE voivodeship (
                             id       BIGSERIAL PRIMARY KEY,
                             name     VARCHAR(100) NOT NULL UNIQUE,
                             map_code VARCHAR(20)
);

CREATE TABLE event (
                       id               BIGSERIAL PRIMARY KEY,
                       title            VARCHAR(255) NOT NULL,
                       description      TEXT,
                       start_date       TIMESTAMP    NOT NULL,
                       end_date         TIMESTAMP,
                       city             VARCHAR(100),
                       address          VARCHAR(255),
                       status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
                       rejection_reason VARCHAR(1000),
                       organizer_id     BIGINT REFERENCES app_user(id),
                       organizer_name   VARCHAR(255),
                       moderator_id     BIGINT REFERENCES app_user(id),
                       voivodeship_id   BIGINT NOT NULL REFERENCES voivodeship(id),
                       created_at       TIMESTAMP NOT NULL DEFAULT now(),
                       updated_at       TIMESTAMP,
                       checkin_count    INTEGER   NOT NULL DEFAULT 0
);

CREATE TABLE event_category (
                                event_id    BIGINT NOT NULL REFERENCES event(id) ON DELETE CASCADE,
                                category_id BIGINT NOT NULL REFERENCES category(id),
                                PRIMARY KEY (event_id, category_id)
);

CREATE TABLE event_image (
                             id       BIGSERIAL PRIMARY KEY,
                             event_id BIGINT       NOT NULL REFERENCES event(id) ON DELETE CASCADE,
                             url      VARCHAR(500) NOT NULL
);

CREATE TABLE checkin (
                         id         BIGSERIAL PRIMARY KEY,
                         user_id    BIGINT    NOT NULL REFERENCES app_user(id),
                         event_id   BIGINT    NOT NULL REFERENCES event(id) ON DELETE CASCADE,
                         created_at TIMESTAMP NOT NULL DEFAULT now(),
                         UNIQUE (user_id, event_id)
);

CREATE INDEX idx_event_start_date ON event(start_date);
CREATE INDEX idx_event_status ON event(status);
CREATE INDEX idx_event_voivodeship ON event(voivodeship_id);