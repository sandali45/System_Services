import { Router } from "express";
import { requireAdminKey } from "../middleware/admin-key.js";
import * as controller from "../controllers/notification.controller.js";

const router = Router();

router.use(requireAdminKey);

router.get("/notifications", controller.listNotifications);
router.get("/notifications/stats", controller.getStats);
router.get("/queue/stats", controller.getQueueStats);

router.post(
  "/notifications/booking-update",
  controller.createBookingUpdate
);

router.post(
  "/notifications/reminder",
  controller.createReminder
);

router.patch(
  "/notifications/:id/read",
  controller.markRead
);

router.post(
  "/notifications/:id/requeue",
  controller.requeue
);

export default router;
