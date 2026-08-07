INSERT INTO app_users (id, full_name, role)
VALUES
    (1, 'System Administrator', 'admin'),
    (2, 'Demo Customer', 'customer'),
    (3, 'Demo Worker', 'worker')
ON CONFLICT (id) DO NOTHING;

INSERT INTO demo_bookings (
    id,
    customer_id,
    worker_id,
    status,
    scheduled_at
)
VALUES
    (101, 2, 3, 'accepted', NOW() + INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('app_users', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM app_users), 1)
);

SELECT setval(
    pg_get_serial_sequence('demo_bookings', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM demo_bookings), 1)
);
