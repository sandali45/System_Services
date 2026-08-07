import pool from "../config/db.js";

export async function createNotification({
  bookingId,
  recipientUserId,
  recipientRole,
  type,
  title,
  message,
  payload,
  scheduledFor
}) {
  const result = await pool.query(
    `
      INSERT INTO notifications (
        booking_id,
        recipient_user_id,
        recipient_role,
        type,
        title,
        message,
        payload,
        status,
        scheduled_for
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'queued', $8)
      RETURNING *
    `,
    [
      bookingId,
      recipientUserId,
      recipientRole,
      type,
      title,
      message,
      payload,
      scheduledFor
    ]
  );

  return result.rows[0];
}

export async function attachJobId(notificationId, jobId) {
  const result = await pool.query(
    `
      UPDATE notifications
      SET bullmq_job_id = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [notificationId, String(jobId)]
  );

  return result.rows[0] || null;
}

export async function markProcessing(notificationId, attemptsMade) {
  await pool.query(
    `
      UPDATE notifications
      SET
        status = 'processing',
        attempts_made = $2,
        failure_reason = NULL,
        updated_at = NOW()
      WHERE id = $1
    `,
    [notificationId, attemptsMade]
  );
}

export async function markSent(notificationId, attemptsMade) {
  const result = await pool.query(
    `
      UPDATE notifications
      SET
        status = 'sent',
        attempts_made = $2,
        sent_at = NOW(),
        failure_reason = NULL,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [notificationId, attemptsMade]
  );

  return result.rows[0] || null;
}

export async function markFailed(notificationId, reason, attemptsMade) {
  await pool.query(
    `
      UPDATE notifications
      SET
        status = 'failed',
        attempts_made = $3,
        failure_reason = $2,
        updated_at = NOW()
      WHERE id = $1
    `,
    [notificationId, reason, attemptsMade]
  );
}

export async function listNotifications({
  status,
  type,
  recipientUserId,
  limit,
  offset
}) {
  const filters = [];
  const values = [];

  function add(condition, value) {
    if (value === undefined || value === null || value === "") return;
    values.push(value);
    filters.push(condition.replace("?", `$${values.length}`));
  }

  add("status = ?", status);
  add("type = ?", type);
  add("recipient_user_id = ?", recipientUserId);

  const where = filters.length
    ? `WHERE ${filters.join(" AND ")}`
    : "";

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM notifications ${where}`,
    values
  );

  values.push(limit);
  const limitParam = `$${values.length}`;
  values.push(offset);
  const offsetParam = `$${values.length}`;

  const rowsResult = await pool.query(
    `
      SELECT *
      FROM notifications
      ${where}
      ORDER BY created_at DESC
      LIMIT ${limitParam}
      OFFSET ${offsetParam}
    `,
    values
  );

  return {
    rows: rowsResult.rows,
    total: countResult.rows[0].total
  };
}

export async function getStats() {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'queued')::int AS queued,
      COUNT(*) FILTER (WHERE status = 'processing')::int AS processing,
      COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
      COUNT(*) FILTER (WHERE status = 'read')::int AS read,
      COUNT(*) FILTER (WHERE type = 'booking_update')::int
        AS booking_updates,
      COUNT(*) FILTER (WHERE type = 'booking_reminder')::int
        AS reminders
    FROM notifications
  `);

  return result.rows[0];
}

export async function findById(id) {
  const result = await pool.query(
    "SELECT * FROM notifications WHERE id = $1",
    [id]
  );

  return result.rows[0] || null;
}

export async function markRead(id) {
  const result = await pool.query(
    `
      UPDATE notifications
      SET status = 'read', read_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function resetForRequeue(id) {
  const result = await pool.query(
    `
      UPDATE notifications
      SET
        status = 'queued',
        failure_reason = NULL,
        bullmq_job_id = NULL,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [id]
  );

  return result.rows[0] || null;
}
