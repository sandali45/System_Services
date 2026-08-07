import { asyncHandler } from "../utils/async-handler.js";
import * as service from "../services/notification.service.js";

export const createBookingUpdate = asyncHandler(async (req, res) => {
  const notification = await service.queueBookingUpdate(req.body);

  res.status(202).json({
    success: true,
    message: "Booking notification queued",
    data: notification
  });
});

export const createReminder = asyncHandler(async (req, res) => {
  const notification = await service.scheduleReminder(req.body);

  res.status(202).json({
    success: true,
    message: "Booking reminder scheduled",
    data: notification
  });
});

export const listNotifications = asyncHandler(async (req, res) => {
  const result = await service.listNotifications(req.query);
  res.json({ success: true, ...result });
});

export const getStats = asyncHandler(async (req, res) => {
  const data = await service.getNotificationStats();
  res.json({ success: true, data });
});

export const getQueueStats = asyncHandler(async (req, res) => {
  const data = await service.getQueueStats();
  res.json({ success: true, data });
});

export const markRead = asyncHandler(async (req, res) => {
  const data = await service.markNotificationRead(req.params.id);
  res.json({
    success: true,
    message: "Notification marked as read",
    data
  });
});

export const requeue = asyncHandler(async (req, res) => {
  const data = await service.requeueNotification(req.params.id);
  res.status(202).json({
    success: true,
    message: "Notification requeued",
    data
  });
});
