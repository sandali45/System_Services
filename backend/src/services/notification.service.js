import { ApiError } from "../utils/api-error.js";
import { notificationQueue } from "../queues/notification.queue.js";
import * as repository from "../repositories/notification.repository.js";

const VALID_ROLES = new Set(["customer", "worker", "admin"]);
const VALID_STATUSES = new Set([
  "pending",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
  "rejected"
]);

function positiveInteger(value, fieldName) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiError(400, `${fieldName} must be a positive integer`);
  }

  return number;
}

function validateRole(value) {
  const role = String(value || "").toLowerCase();

  if (!VALID_ROLES.has(role)) {
    throw new ApiError(
      400,
      "Recipient role must be customer, worker, or admin"
    );
  }

  return role;
}

function pagination(query) {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));

  return {
    page,
    limit,
    offset: (page - 1) * limit
  };
}

function statusMessage(status) {
  const messages = {
    pending: "Your booking is waiting for confirmation.",
    accepted: "Your booking has been accepted.",
    in_progress: "Your service job is now in progress.",
    completed: "Your booking has been completed.",
    cancelled: "Your booking has been cancelled.",
    rejected: "Your booking request was rejected."
  };

  return messages[status] || `Your booking status changed to ${status}.`;
}

export async function queueBookingUpdate(input) {
  const bookingId = positiveInteger(input.bookingId, "Booking ID");
  const recipientUserId = positiveInteger(
    input.recipientUserId,
    "Recipient user ID"
  );
  const recipientRole = validateRole(input.recipientRole);
  const bookingStatus = String(input.bookingStatus || "").toLowerCase();

  if (!VALID_STATUSES.has(bookingStatus)) {
    throw new ApiError(400, "Invalid booking status");
  }

  const notification = await repository.createNotification({
    bookingId,
    recipientUserId,
    recipientRole,
    type: "booking_update",
    title: "Booking update",
    message: statusMessage(bookingStatus),
    payload: {
      bookingId,
      bookingStatus
    },
    scheduledFor: null
  });

  const job = await notificationQueue.add(
    "booking-update",
    {
      notificationId: notification.id,
      bookingId,
      recipientUserId,
      recipientRole,
      bookingStatus
    },
    {
      jobId: `update-${bookingId}-${bookingStatus}-${recipientUserId}`
    }
  );

  return repository.attachJobId(notification.id, job.id);
}

export async function scheduleReminder(input) {
  const bookingId = positiveInteger(input.bookingId, "Booking ID");
  const recipientUserId = positiveInteger(
    input.recipientUserId,
    "Recipient user ID"
  );
  const recipientRole = validateRole(input.recipientRole);
  const remindAt = new Date(input.remindAt);

  if (Number.isNaN(remindAt.getTime())) {
    throw new ApiError(400, "A valid reminder date/time is required");
  }

  if (remindAt.getTime() <= Date.now()) {
    throw new ApiError(400, "Reminder date/time must be in the future");
  }

  const delay = remindAt.getTime() - Date.now();

  const notification = await repository.createNotification({
    bookingId,
    recipientUserId,
    recipientRole,
    type: "booking_reminder",
    title: "Upcoming booking reminder",
    message: "You have an upcoming service booking.",
    payload: {
      bookingId,
      remindAt: remindAt.toISOString()
    },
    scheduledFor: remindAt
  });

  const job = await notificationQueue.add(
    "booking-reminder",
    {
      notificationId: notification.id,
      bookingId,
      recipientUserId,
      recipientRole,
      remindAt: remindAt.toISOString()
    },
    {
      delay,
      jobId: `reminder-${bookingId}-${recipientUserId}-${remindAt.getTime()}`
    }
  );

  return repository.attachJobId(notification.id, job.id);
}

export async function listNotifications(query) {
  const { page, limit, offset } = pagination(query);

  const result = await repository.listNotifications({
    status: query.status,
    type: query.type,
    recipientUserId: query.recipientUserId
      ? positiveInteger(query.recipientUserId, "Recipient user ID")
      : undefined,
    limit,
    offset
  });

  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit)
    }
  };
}

export async function getNotificationStats() {
  return repository.getStats();
}

export async function getQueueStats() {
  const counts = await notificationQueue.getJobCounts(
    "waiting",
    "active",
    "completed",
    "failed",
    "delayed",
    "paused"
  );

  return counts;
}

export async function markNotificationRead(idValue) {
  const id = positiveInteger(idValue, "Notification ID");
  const notification = await repository.markRead(id);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return notification;
}

export async function requeueNotification(idValue) {
  const id = positiveInteger(idValue, "Notification ID");
  const notification = await repository.findById(id);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  if (notification.status !== "failed") {
    throw new ApiError(
      409,
      "Only failed notifications can be requeued"
    );
  }

  const reset = await repository.resetForRequeue(id);

  const job = await notificationQueue.add(
    "manual-requeue",
    {
      notificationId: reset.id,
      bookingId: reset.booking_id,
      recipientUserId: reset.recipient_user_id,
      recipientRole: reset.recipient_role,
      payload: reset.payload
    },
    {
      jobId: `requeue-${reset.id}-${Date.now()}`
    }
  );

  return repository.attachJobId(reset.id, job.id);
}
