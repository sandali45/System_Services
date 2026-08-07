# Integration Guide

## Developer 1: Authentication

Replace:

```text
backend/src/middleware/admin-key.js
```

with the shared JWT authentication and role middleware.

Expected authenticated user shape:

```js
req.user = {
  id: 1,
  role: "admin"
};
```

## Developer 3: Booking events

After a booking status changes, call the notification service.

Example internal request:

```http
POST /api/v1/notifications/booking-update
Content-Type: application/json
x-admin-key: dev-admin-key
```

```json
{
  "bookingId": 101,
  "recipientUserId": 2,
  "recipientRole": "customer",
  "bookingStatus": "accepted"
}
```

When a booking time is confirmed, schedule a reminder:

```json
{
  "bookingId": 101,
  "recipientUserId": 2,
  "recipientRole": "customer",
  "remindAt": "2026-08-06T09:00:00.000Z"
}
```

## Notification delivery provider

The worker currently logs the message in the terminal.

Replace:

```text
backend/src/workers/notification.worker.js
deliverNotification()
```

with the agreed notification method.

## Important integration decisions

Confirm these with the team:

- Booking status spellings
- Customer and worker user IDs
- Timezone handling
- How early reminders should be sent
- Push/email/SMS/in-app delivery method
- Whether admins can retry failed jobs
