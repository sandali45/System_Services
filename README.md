# ITX System Services Project

Standalone Developer 4 module for:

- Booking update notifications
- Scheduled booking reminders
- BullMQ background jobs
- Redis queue storage
- Retry and failure handling
- PostgreSQL notification records
- React monitoring dashboard

## Ports

- PostgreSQL: `5434`
- Redis: `6380`
- Backend API: `3002`
- React frontend: `5175`

## Architecture

```text
React Dashboard / Booking Module
              |
              v
        Express REST API
              |
       Create DB Record
              |
              v
          BullMQ Queue
              |
              v
             Redis
              |
              v
      Notification Worker
              |
              v
     Mark Sent / Failed in DB
```

## 1. Start PostgreSQL and Redis

From the main project folder:

```powershell
docker compose up -d
```

Check:

```powershell
docker ps
```

You should see:

```text
itx-system-postgres
itx-system-redis
```

## 2. Create the database tables

```powershell
Get-Content .\database\schema.sql |
docker exec -i itx-system-postgres psql -U postgres -d itx_system_services
```

Insert sample data:

```powershell
Get-Content .\database\seed.sql |
docker exec -i itx-system-postgres psql -U postgres -d itx_system_services
```

## 3. Start the backend API

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```

Expected:

```text
PostgreSQL connected
System Services API running at http://localhost:3002
```

## 4. Start the notification worker

Open a second terminal:

```powershell
cd backend
npm run worker
```

Expected:

```text
Notification worker started
```

The API and worker must both stay running.

## 5. Start the React dashboard

Open a third terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open:

```text
http://localhost:5175
```

## Demo admin key

The frontend already uses:

```text
dev-admin-key
```

This is only for the standalone demo. Replace the API-key middleware with
Developer 1's JWT and role middleware before group integration.

## Main endpoints

```text
GET    /health
GET    /api/v1/notifications
GET    /api/v1/notifications/stats
GET    /api/v1/queue/stats

POST   /api/v1/notifications/booking-update
POST   /api/v1/notifications/reminder

PATCH  /api/v1/notifications/:id/read
POST   /api/v1/notifications/:id/requeue
```

## Example booking update request

```json
{
  "bookingId": 101,
  "recipientUserId": 2,
  "recipientRole": "customer",
  "bookingStatus": "accepted"
}
```

## Example reminder request

Use a future ISO date:

```json
{
  "bookingId": 101,
  "recipientUserId": 2,
  "recipientRole": "customer",
  "remindAt": "2026-08-06T09:00:00.000Z"
}
```

## Before group integration

1. Replace demo Admin API key with Developer 1 authentication.
2. Confirm booking status names with Developer 3.
3. Call the booking-update service after a booking status changes.
4. Call the reminder service when a booking date/time is confirmed.
5. Replace the demo `deliverNotification()` function with the selected push,
   email, SMS, or in-app provider.
6. Match shared user and booking ID types.
