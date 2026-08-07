import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const NOTIFICATION_QUEUE_NAME = "itx-notifications";

export const notificationQueue = new Queue(
  NOTIFICATION_QUEUE_NAME,
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000
      },
      removeOnComplete: {
        age: 24 * 60 * 60,
        count: 500
      },
      removeOnFail: {
        age: 7 * 24 * 60 * 60,
        count: 1000
      }
    }
  }
);
