CREATE TABLE IF NOT EXISTS app_users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('customer', 'worker', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demo_bookings (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES app_users(id),
    worker_id BIGINT REFERENCES app_users(id),
    status VARCHAR(30) NOT NULL,
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT,
    recipient_user_id BIGINT NOT NULL,
    recipient_role VARCHAR(20) NOT NULL
        CHECK (recipient_role IN ('customer', 'worker', 'admin')),
    type VARCHAR(40) NOT NULL
        CHECK (type IN ('booking_update', 'booking_reminder')),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'read')),
    bullmq_job_id VARCHAR(200),
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failure_reason TEXT,
    attempts_made INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient
    ON notifications(recipient_user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_status
    ON notifications(status);

CREATE INDEX IF NOT EXISTS idx_notifications_type
    ON notifications(type);

CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for
    ON notifications(scheduled_for);
