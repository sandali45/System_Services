import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Send,
  XCircle
} from "lucide-react";
import { api } from "./api.js";

const initialUpdate = {
  bookingId: 101,
  recipientUserId: 2,
  recipientRole: "customer",
  bookingStatus: "accepted"
};

function futureLocalDate(minutes = 3) {
  const date = new Date(Date.now() + minutes * 60_000);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

const initialReminder = {
  bookingId: 101,
  recipientUserId: 2,
  recipientRole: "customer",
  remindAt: futureLocalDate()
};

function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {status}
    </span>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <article className="stat-card">
      <div className="stat-icon">
        <Icon size={22} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value ?? 0}</strong>
      </div>
    </article>
  );
}

export default function App() {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({});
  const [queueStats, setQueueStats] = useState({});
  const [updateForm, setUpdateForm] = useState(initialUpdate);
  const [reminderForm, setReminderForm] =
    useState(initialReminder);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [list, notificationStats, queue] =
        await Promise.all([
          api.getNotifications(),
          api.getNotificationStats(),
          api.getQueueStats()
        ]);

      setNotifications(list.data || []);
      setStats(notificationStats.data || {});
      setQueueStats(queue.data || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, []);

  async function submitUpdate(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await api.createBookingUpdate({
        ...updateForm,
        bookingId: Number(updateForm.bookingId),
        recipientUserId: Number(updateForm.recipientUserId)
      });

      setMessage("Booking notification added to the queue.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitReminder(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await api.createReminder({
        ...reminderForm,
        bookingId: Number(reminderForm.bookingId),
        recipientUserId: Number(
          reminderForm.recipientUserId
        ),
        remindAt: new Date(
          reminderForm.remindAt
        ).toISOString()
      });

      setMessage("Booking reminder scheduled.");
      setReminderForm((current) => ({
        ...current,
        remindAt: futureLocalDate()
      }));

      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function markRead(id) {
    try {
      await api.markRead(id);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function requeue(id) {
    try {
      await api.requeue(id);
      setMessage("Failed notification requeued.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const queueTotal = useMemo(
    () =>
      Object.values(queueStats).reduce(
        (sum, value) => sum + Number(value || 0),
        0
      ),
    [queueStats]
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">ITX</span>
          <div>
            <h1>System Services</h1>
            <p>Notifications and background jobs</p>
          </div>
        </div>

        <button className="secondary-button" onClick={loadData}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      <main>
        <section className="hero">
          <div>
            <span className="eyebrow">Developer 4 Module</span>
            <h2>Notification Service Dashboard</h2>
            <p>
              Create booking notifications, schedule reminders,
              and monitor BullMQ background jobs.
            </p>
          </div>

          <div className="queue-summary">
            <span>Queue jobs</span>
            <strong>{queueTotal}</strong>
            <small>
              Waiting {queueStats.waiting || 0} · Delayed{" "}
              {queueStats.delayed || 0} · Failed{" "}
              {queueStats.failed || 0}
            </small>
          </div>
        </section>

        {message && <div className="notice success">{message}</div>}
        {error && <div className="notice error">{error}</div>}

        <section className="stats-grid">
          <StatCard
            icon={Bell}
            label="Total notifications"
            value={stats.total}
          />
          <StatCard
            icon={Clock3}
            label="Queued"
            value={stats.queued}
          />
          <StatCard
            icon={CheckCircle2}
            label="Sent"
            value={stats.sent}
          />
          <StatCard
            icon={XCircle}
            label="Failed"
            value={stats.failed}
          />
        </section>

        <section className="forms-grid">
          <form className="panel" onSubmit={submitUpdate}>
            <div className="panel-heading">
              <Send size={20} />
              <div>
                <h3>Booking update</h3>
                <p>Queue an immediate status notification.</p>
              </div>
            </div>

            <label>
              Booking ID
              <input
                type="number"
                min="1"
                value={updateForm.bookingId}
                onChange={(event) =>
                  setUpdateForm({
                    ...updateForm,
                    bookingId: event.target.value
                  })
                }
                required
              />
            </label>

            <label>
              Recipient user ID
              <input
                type="number"
                min="1"
                value={updateForm.recipientUserId}
                onChange={(event) =>
                  setUpdateForm({
                    ...updateForm,
                    recipientUserId: event.target.value
                  })
                }
                required
              />
            </label>

            <label>
              Recipient role
              <select
                value={updateForm.recipientRole}
                onChange={(event) =>
                  setUpdateForm({
                    ...updateForm,
                    recipientRole: event.target.value
                  })
                }
              >
                <option value="customer">Customer</option>
                <option value="worker">Worker</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <label>
              Booking status
              <select
                value={updateForm.bookingStatus}
                onChange={(event) =>
                  setUpdateForm({
                    ...updateForm,
                    bookingStatus: event.target.value
                  })
                }
              >
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>

            <button className="primary-button" type="submit">
              <Send size={17} />
              Queue notification
            </button>
          </form>

          <form className="panel" onSubmit={submitReminder}>
            <div className="panel-heading">
              <CalendarClock size={20} />
              <div>
                <h3>Booking reminder</h3>
                <p>Schedule a delayed notification.</p>
              </div>
            </div>

            <label>
              Booking ID
              <input
                type="number"
                min="1"
                value={reminderForm.bookingId}
                onChange={(event) =>
                  setReminderForm({
                    ...reminderForm,
                    bookingId: event.target.value
                  })
                }
                required
              />
            </label>

            <label>
              Recipient user ID
              <input
                type="number"
                min="1"
                value={reminderForm.recipientUserId}
                onChange={(event) =>
                  setReminderForm({
                    ...reminderForm,
                    recipientUserId: event.target.value
                  })
                }
                required
              />
            </label>

            <label>
              Recipient role
              <select
                value={reminderForm.recipientRole}
                onChange={(event) =>
                  setReminderForm({
                    ...reminderForm,
                    recipientRole: event.target.value
                  })
                }
              >
                <option value="customer">Customer</option>
                <option value="worker">Worker</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <label>
              Reminder date and time
              <input
                type="datetime-local"
                value={reminderForm.remindAt}
                onChange={(event) =>
                  setReminderForm({
                    ...reminderForm,
                    remindAt: event.target.value
                  })
                }
                required
              />
            </label>

            <button className="primary-button" type="submit">
              <CalendarClock size={17} />
              Schedule reminder
            </button>
          </form>
        </section>

        <section className="panel table-panel">
          <div className="panel-heading">
            <Bell size={20} />
            <div>
              <h3>Notification history</h3>
              <p>
                Automatically refreshes every five seconds.
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Booking</th>
                  <th>Recipient</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Scheduled</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && notifications.length === 0 ? (
                  <tr>
                    <td colSpan="8">Loading...</td>
                  </tr>
                ) : notifications.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      No notifications created yet.
                    </td>
                  </tr>
                ) : (
                  notifications.map((notification) => (
                    <tr key={notification.id}>
                      <td>#{notification.id}</td>
                      <td>
                        {notification.type ===
                        "booking_reminder"
                          ? "Reminder"
                          : "Booking update"}
                      </td>
                      <td>{notification.booking_id || "—"}</td>
                      <td>
                        {notification.recipient_user_id}
                        <small className="role-text">
                          {notification.recipient_role}
                        </small>
                      </td>
                      <td className="message-cell">
                        {notification.message}
                        {notification.failure_reason && (
                          <small className="failure-text">
                            {notification.failure_reason}
                          </small>
                        )}
                      </td>
                      <td>
                        <StatusBadge
                          status={notification.status}
                        />
                      </td>
                      <td>
                        {notification.scheduled_for
                          ? new Date(
                              notification.scheduled_for
                            ).toLocaleString()
                          : "Immediate"}
                      </td>
                      <td>
                        {notification.status === "sent" && (
                          <button
                            className="link-button"
                            onClick={() =>
                              markRead(notification.id)
                            }
                          >
                            Mark read
                          </button>
                        )}
                        {notification.status === "failed" && (
                          <button
                            className="link-button danger"
                            onClick={() =>
                              requeue(notification.id)
                            }
                          >
                            Requeue
                          </button>
                        )}
                        {!["sent", "failed"].includes(
                          notification.status
                        ) && "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
