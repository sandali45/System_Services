const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3002/api/v1";

const ADMIN_KEY =
  import.meta.env.VITE_ADMIN_API_KEY ||
  "dev-admin-key";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_KEY,
      ...(options.headers || {})
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const api = {
  getNotifications: () => request("/notifications?limit=50"),
  getNotificationStats: () => request("/notifications/stats"),
  getQueueStats: () => request("/queue/stats"),

  createBookingUpdate: (body) =>
    request("/notifications/booking-update", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  createReminder: (body) =>
    request("/notifications/reminder", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  markRead: (id) =>
    request(`/notifications/${id}/read`, {
      method: "PATCH"
    }),

  requeue: (id) =>
    request(`/notifications/${id}/requeue`, {
      method: "POST"
    })
};
