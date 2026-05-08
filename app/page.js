"use client";

import { useEffect, useState } from "react";

const serviceOptions = ["Swedish Massage", "Deep Tissue Massage","Head and shoulder", "Half Massage", "Aromatherapy Massage"];

const durationOptions = [30, 45, 60, 90];

const translations = {
  en: {
    languageLabel: "Language",
    heroKicker: "Premium Care and Relaxation",
    heroTitle: "Massage Booking Experience",
    heroCopy:
      "Reserve your session in seconds with a modern booking flow. Open Monday to Saturday, from 09:00 to 19:00.",
    heroCta: "Book Your Session",
    bookAppointment: "Book Appointment",
    workingHours: "Working days: Monday-Saturday | Hours: 09:00-19:00",
    customerName: "Customer Name",
    customerNamePlaceholder: "Enter customer name",
    customerEmail: "Customer Email",
    customerEmailPlaceholder: "Enter customer email",
    serviceType: "Service Type",
    startDateTime: "Start Date and Time",
    durationMinutes: "Duration (minutes)",
    creating: "Creating...",
    confirmBooking: "Confirm Booking",
    cancelBooking: "Cancel Booking",
    cancelling: "Cancelling...",
    cancelSuccess: "Booking cancelled successfully.",
    bookingSuccess: "Booking created successfully.",
    notificationStatus: "Notification Status",
    customerNotificationSent: "Customer notification sent: Yes",
    workerNotificationsSent: "Worker notifications sent:",
    totalRecipients: "Total recipients notified:",
    warningPrefix: "Booking created, but notification issue:",
    emailRecipients: "Email recipients:",
    upcomingBookings: "Upcoming Bookings",
    loadingBookings: "Loading bookings...",
    noBookings: "No bookings yet.",
    to: "to",
    serviceLabels: {
      "Swedish Massage": "Swedish Massage",
      "Deep Tissue Massage": "Deep Tissue Massage",
      "Half Massage": "Half Massage",
      "Head and shoulder": "Head and shoulder",
      "Aromatherapy Massage": "Aromatherapy Massage",
    },
  },
  am: {
    languageLabel: "ቋንቋ",
    heroKicker: "ከፍተኛ ደረጃ እንክብካቤ እና መዝናናት",
    heroTitle: "የማሳጅ ቀጠሮ ማስያዣ",
    heroCopy:
      "በዘመናዊ የማስያዣ ሂደት በጥቂት ሰከንዶች ቀጠሮዎን ያስይዙ። ከሰኞ እስከ ቅዳሜ ከ09:00 እስከ 19:00 ክፍት ነን።",
    heroCta: "ቀጠሮ ያስይዙ",
    bookAppointment: "ቀጠሮ ያስይዙ",
    workingHours: "የስራ ቀናት: ሰኞ-ቅዳሜ | ሰዓታት: 09:00-19:00",
    customerName: "የደንበኛ ስም",
    customerNamePlaceholder: "የደንበኛ ስም ያስገቡ",
    customerEmail: "የደንበኛ ኢሜይል",
    customerEmailPlaceholder: "የደንበኛ ኢሜይል ያስገቡ",
    serviceType: "የአገልግሎት አይነት",
    startDateTime: "የመጀመሪያ ቀን እና ሰዓት",
    durationMinutes: "ቆይታ (ደቂቃ)",
    creating: "በመፍጠር ላይ...",
    confirmBooking: "ቀጠሮ ያረጋግጡ",
    cancelBooking: "ቀጠሮ ሰርዝ",
    cancelling: "በመሰረዝ ላይ...",
    cancelSuccess: "ቀጠሮው በተሳካ ሁኔታ ተሰርዟል።",
    bookingSuccess: "ቀጠሮው በተሳካ ሁኔታ ተፈጥሯል።",
    notificationStatus: "የማሳወቂያ ሁኔታ",
    customerNotificationSent: "ለደንበኛ ማሳወቂያ ተልኳል: አዎ",
    workerNotificationsSent: "ለሰራተኞች የተላኩ ማሳወቂያዎች:",
    totalRecipients: "ጠቅላላ የተላከላቸው:",
    warningPrefix: "ቀጠሮ ተፈጥሯል፣ ነገር ግን የማሳወቂያ ችግር አለ:",
    emailRecipients: "ኢሜይል ተቀባዮች:",
    upcomingBookings: "የሚመጡ ቀጠሮዎች",
    loadingBookings: "ቀጠሮዎችን በመጫን ላይ...",
    noBookings: "እስካሁን ቀጠሮ የለም።",
    to: "እስከ",
    serviceLabels: {
      "Swedish Massage": "ስዊዲሽ ማሳጅ",
      "Deep Tissue Massage": "ጥልቅ ቲሹ ማሳጅ",
      "Half Massage": "ጀርባ እና እግር",
      "Head and shoulder": "ጭንቅላት እና ትከሻ",
      "Aromatherapy Massage": "አሮማቴራፒ ማሳጅ",
    },
  },
};

export default function HomePage() {
  const [language, setLanguage] = useState("en");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notificationInfo, setNotificationInfo] = useState(null);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    serviceType: serviceOptions[0],
    startAt: "",
    durationMinutes: 60,
  });
  const t = translations[language];

  function formatDate(isoDate) {
    return new Date(isoDate).toLocaleString(language === "am" ? "am-ET" : "en-US");
  }

  async function loadBookings() {
    try {
      setLoading(true);
      const response = await fetch("/api/bookings");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch bookings.");
      }
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setNotificationInfo(null);

    try {
      setSubmitting(true);
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not create booking.");
      }

      setSuccess(t.bookingSuccess);
      setNotificationInfo(data.notificationSummary || null);
      setForm((prev) => ({
        ...prev,
        customerName: "",
        customerEmail: "",
        startAt: "",
      }));
      setBookings((prev) =>
        [...prev, data].sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelBooking(bookingId) {
    setError("");
    setSuccess("");
    setNotificationInfo(null);

    try {
      setCancellingId(bookingId);
      const response = await fetch(
        `/api/bookings?id=${encodeURIComponent(bookingId)}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not cancel booking.");
      }

      setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
      // Keep schedule in sync with server-backed calendar data.
      await loadBookings();
      setSuccess(t.cancelSuccess);
      setNotificationInfo(data.notificationSummary || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId("");
    }
  }

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-overlay">
          <div className="language-switcher">
            <label htmlFor="language">{t.languageLabel}</label>
            <select
              id="language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="en">English</option>
              <option value="am">Amharic (አማርኛ)</option>
            </select>
          </div>
          <p className="hero-kicker">{t.heroKicker}</p>
          <h1>{t.heroTitle}</h1>
          <p className="hero-copy">{t.heroCopy}</p>
          <a href="#book-now" className="hero-cta">
            {t.heroCta}
          </a>
        </div>
      </section>

      <section id="book-now" className="booking-layout">
        <article className="booking-card">
          <h2>{t.bookAppointment}</h2>
          <p className="muted">{t.workingHours}</p>
          <form onSubmit={handleSubmit} className="booking-form">
            <label>
              {t.customerName}
              <input
                required
                type="text"
                value={form.customerName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, customerName: event.target.value }))
                }
                placeholder={t.customerNamePlaceholder}
              />
            </label>

            <label>
              {t.customerEmail}
              <input
                required
                type="email"
                value={form.customerEmail}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, customerEmail: event.target.value }))
                }
                placeholder={t.customerEmailPlaceholder}
              />
            </label>

            <label>
              {t.serviceType}
              <select
                value={form.serviceType}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, serviceType: event.target.value }))
                }
              >
                {serviceOptions.map((service) => (
                  <option key={service} value={service}>
                    {t.serviceLabels[service]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.startDateTime}
              <input
                required
                type="datetime-local"
                value={form.startAt}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, startAt: event.target.value }))
                }
              />
            </label>

            <label>
              {t.durationMinutes}
              <select
                value={form.durationMinutes}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    durationMinutes: Number(event.target.value),
                  }))
                }
              >
                {durationOptions.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? t.creating : t.confirmBooking}
            </button>
          </form>

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
          {notificationInfo && (
            <div className="notification-card">
              <h3>{t.notificationStatus}</h3>
              <div className="notification-grid">
                <p>
                  <strong>{t.customerNotificationSent}</strong>
                </p>
                <p>
                  <strong>{t.workerNotificationsSent}</strong> {notificationInfo.sentToWorkers}
                </p>
                <p>
                  <strong>{t.totalRecipients}</strong> {notificationInfo.recipientsCount}
                </p>
                {notificationInfo.recipientsCount > 0 && (
                  <p>
                    <strong>{t.emailRecipients}</strong> {notificationInfo.recipientsCount}
                  </p>
                )}
              </div>
              {notificationInfo.warning && (
                <p className="warning">
                  {t.warningPrefix} {notificationInfo.warning}
                </p>
              )}
            </div>
          )}
        </article>

        <article className="schedule-card">
          <h2>{t.upcomingBookings}</h2>
          {loading ? (
            <p>{t.loadingBookings}</p>
          ) : bookings.length === 0 ? (
            <p>{t.noBookings}</p>
          ) : (
            <ul className="booking-list">
              {bookings.map((booking) => (
                <li key={booking.id} className="booking-item">
                  <div className="booking-item-top">
                    <strong>{booking.customerName}</strong>
                    <span className="booking-service">
                      {t.serviceLabels[booking.serviceType] || booking.serviceType}
                    </span>
                  </div>
                  <span className="booking-email">{booking.customerEmail}</span>
                  <span className="booking-time">
                    {formatDate(booking.startAt)} {t.to} {formatDate(booking.endAt)}
                  </span>
                  <button
                    type="button"
                    className="cancel-booking-btn"
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={cancellingId === booking.id}
                  >
                    {cancellingId === booking.id ? t.cancelling : t.cancelBooking}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
