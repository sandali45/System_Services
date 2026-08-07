import "dotenv/config";
import { Worker } from "bullmq";
import pool from "../config/db.js";
import { redisConnection } from "../config/redis.js";
import {
  NOTIFICATION_QUEUE_NAME
} from "../queues/notification.queue.js";
import * as repository from "../repositories/notification.repository.js";

async function deliverNotification(job) {
  /**
   * DEMO DELIVERY:
   * This logs the notification to the terminal.
   *
   * Later replace this with:
   * - Firebase Cloud Messaging
   * - email provider
   * - SMS provider
   * - in-app notification event
   */
  console.log("Sending notification", {
    jobId: job.id,
    jobName: job.name,
    recipientUserId: job.data.recipientUserId,
    bookingId: job.data.bookingId,
    payload: job.data
  });

  // A small delay makes background processing visible in the dashboard.
  await new Promise((resolve) => setTimeout(resolve, 500));

  // For testing failure handling, set forceFailure=true in a queued job.
  if (job.data.forceFailure === true) {
    throw new Error("Demo notification delivery failure");
  }

  return { delivered: true };
}

const worker = new Worker(
  NOTIFICATION_QUEUE_NAME,
  async (job) => {
    const attemptsMade = Number(job.attemptsMade || 0) + 1;

    await repository.markProcessing(
      job.data.notificationId,
      attemptsMade
    );

    await deliverNotification(job);

    return repository.markSent(
      job.data.notificationId,
      attemptsMade
    );
  },
  {
    connection: redisConnection,
    concurrency: 5
  }
);

worker.on("ready", () => {
  console.log("Notification worker started");
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", async (job, error) => {
  if (!job?.data?.notificationId) return;

  const maxAttempts = Number(job.opts.attempts || 1);
  const attemptsMade = Number(job.attemptsMade || 0);

  // Keep status processing while BullMQ will retry it.
  if (attemptsMade < maxAttempts) {
    console.error(
      `Job ${job.id} failed and will retry: ${error.message}`
    );
    return;
  }

  await repository.markFailed(
    job.data.notificationId,
    error.message,
    attemptsMade
  );

  console.error(
    `Job ${job.id} permanently failed: ${error.message}`
  );
});

worker.on("error", (error) => {
  console.error("Worker error:", error);
});

async function shutdown(signal) {
  console.log(`${signal} received. Closing worker...`);
  await worker.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
