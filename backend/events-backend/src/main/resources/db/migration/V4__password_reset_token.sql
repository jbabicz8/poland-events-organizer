CREATE TABLE password_reset_token (
                                      id         BIGSERIAL PRIMARY KEY,
                                      user_id    BIGINT      NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
                                      token_hash VARCHAR(64) NOT NULL UNIQUE,
                                      expires_at TIMESTAMP   NOT NULL,
                                      used       BOOLEAN     NOT NULL DEFAULT FALSE,
                                      created_at TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX idx_reset_token_user ON password_reset_token(user_id);