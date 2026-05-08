import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

const OPEN_DAYS = [1, 2, 3, 4, 5, 6]; // Monday-Saturday
const START_HOUR = 9;
const END_HOUR = 19;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_TEAM_NOTIFICATION_EMAIL = "geteneshtegegn23@gmail.com";

function parseDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinBusinessHours(startDate, endDate) {
  const day = startDate.getDay();
  if (!OPEN_DAYS.includes(day)) {
    return false;
  }

  const start = startDate.getHours() + startDate.getMinutes() / 60;
  const end = endDate.getHours() + endDate.getMinutes() / 60;
  return start >= START_HOUR && end <= END_HOUR;
}

function bookingToResponse(booking) {
  return {
    id: booking.id,
    customerName: booking.customer_name,
    customerEmail: booking.customer_email,
    serviceType: booking.service_type,
    startAt: booking.start_at,
    endAt: booking.end_at,
    durationMinutes: booking.duration_minutes,
    createdAt: booking.created_at,
  };
}

function buildNotificationMessage(booking) {
  return `Booking confirmed for ${booking.customer_name} (${booking.customer_email}) on ${new Date(
    booking.start_at
  ).toLocaleString()} for ${booking.duration_minutes} minutes (${booking.service_type}).`;
}

function createMailerTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

async function sendBookingEmails({ booking, workerEmails, isCancellation = false }) {
  const transporter = createMailerTransport();
  if (!transporter) {
    return { sentCount: 0, warning: "SMTP is not configured." };
  }

  const teamNotificationEmail =
    process.env.TEAM_NOTIFICATION_EMAIL || DEFAULT_TEAM_NOTIFICATION_EMAIL;

  const recipientSet = new Set([
    booking.customer_email,
    teamNotificationEmail.trim().toLowerCase(),
    ...workerEmails.map((email) => email.trim().toLowerCase()),
  ]);

  const recipients = [...recipientSet].filter(Boolean);
  if (recipients.length === 0) {
    return { sentCount: 0, warning: "No recipient email addresses available." };
  }

  const fromAddress =
    process.env.NOTIFICATION_FROM_EMAIL || process.env.SMTP_USER;
  const subject = isCancellation
    ? `Booking cancelled: ${booking.service_type}`
    : `Booking confirmed: ${booking.service_type}`;
  const formattedStart = new Date(booking.start_at).toLocaleString();
  const text = [
    `Hello,`,
    ``,
    isCancellation
      ? `A booking has been cancelled.`
      : `A new booking has been confirmed.`,
    `Customer: ${booking.customer_name} (${booking.customer_email})`,
    `Service: ${booking.service_type}`,
    `Start: ${formattedStart}`,
    `Duration: ${booking.duration_minutes} minutes`,
    ``,
    `Thank you.`,
  ].join("\n");

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: recipients.join(","),
      subject,
      text,
    });
    return { sentCount: recipients.length, warning: null };
  } catch (error) {
    return {
      sentCount: 0,
      warning: error.message || "Could not send booking email.",
    };
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("start_at", { ascending: true });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const normalized = data.map(bookingToResponse);

    return NextResponse.json(normalized, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Could not load bookings." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, serviceType, startAt, durationMinutes } =
      body;

    if (
      !customerName ||
      !customerEmail ||
      !serviceType ||
      !startAt ||
      !durationMinutes
    ) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }

    const duration = Number(durationMinutes);
    if (!Number.isInteger(duration) || duration <= 0) {
      return NextResponse.json(
        { message: "Duration must be a positive number of minutes." },
        { status: 400 }
      );
    }

    if (!EMAIL_PATTERN.test(customerEmail.trim().toLowerCase())) {
      return NextResponse.json(
        { message: "Customer email is not valid." },
        { status: 400 }
      );
    }

    const startDate = parseDateTime(startAt);
    if (!startDate) {
      return NextResponse.json(
        { message: "Invalid booking start date/time." },
        { status: 400 }
      );
    }

    const endDate = new Date(startDate.getTime() + duration * 60000);

    if (!isWithinBusinessHours(startDate, endDate)) {
      return NextResponse.json(
        {
          message:
            "Bookings must be Monday to Saturday and between 09:00 and 19:00.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data: overlaps, error: overlapError } = await supabase
      .from("bookings")
      .select("id")
      .lt("start_at", endDate.toISOString())
      .gt("end_at", startDate.toISOString())
      .limit(1);

    if (overlapError) {
      return NextResponse.json({ message: overlapError.message }, { status: 500 });
    }

    if (overlaps.length > 0) {
      return NextResponse.json(
        { message: "This time slot is already booked." },
        { status: 409 }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("bookings")
      .insert({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim().toLowerCase(),
        service_type: serviceType.trim(),
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        duration_minutes: duration,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ message: insertError.message }, { status: 500 });
    }

    const { data: workers, error: workersError } = await supabase
      .from("workers")
      .select("id, full_name, email")
      .eq("is_active", true);

    const notificationMessage = buildNotificationMessage(inserted);
    const workerNotifications = (workers || []).map((worker) => ({
      booking_id: inserted.id,
      recipient_type: "worker",
      recipient_name: worker.full_name,
      recipient_email: worker.email,
      channel: "in_app",
      message: notificationMessage,
      status: "sent",
    }));

    const customerNotification = {
      booking_id: inserted.id,
      recipient_type: "customer",
      recipient_name: inserted.customer_name,
      recipient_email: inserted.customer_email,
      channel: "in_app",
      message: notificationMessage,
      status: "sent",
    };

    const notificationsToInsert = [customerNotification, ...workerNotifications];
    let notificationWarning = null;

    if (!workersError) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notificationsToInsert);
      if (notificationError) {
        notificationWarning = notificationError.message;
      }
    } else {
      notificationWarning = workersError.message;
    }

    const { sentCount: emailSentCount, warning: emailWarning } =
      await sendBookingEmails({
        booking: inserted,
        workerEmails: (workers || []).map((worker) => worker.email),
      });

    const mergedWarning = [notificationWarning, emailWarning]
      .filter(Boolean)
      .join(" | ");

    return NextResponse.json(
      {
        ...bookingToResponse(inserted),
        notificationSummary: {
          recipientsCount: notificationsToInsert.length,
          sentToCustomer: true,
          sentToWorkers: workerNotifications.length,
          warning: mergedWarning || null,
        },
        emailSummary: {
          recipientsCount: emailSentCount,
          warning: emailWarning,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Could not create booking." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("id");

    if (!bookingId) {
      return NextResponse.json(
        { message: "Booking id is required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError) {
      return NextResponse.json({ message: bookingError.message }, { status: 500 });
    }

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found." },
        { status: 404 }
      );
    }

    const { data: workers, error: workersError } = await supabase
      .from("workers")
      .select("id, full_name, email")
      .eq("is_active", true);

    const workerNotifications = workers || [];
    let notificationWarning = null;
    if (workersError) {
      notificationWarning = workersError.message;
    }

    const { data: removed, error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    if (!removed) {
      return NextResponse.json(
        { message: "Booking not found." },
        { status: 404 }
      );
    }

    const { sentCount: emailSentCount, warning: emailWarning } =
      await sendBookingEmails({
        booking,
        workerEmails: (workers || []).map((worker) => worker.email),
        isCancellation: true,
      });

    const mergedWarning = [notificationWarning, emailWarning]
      .filter(Boolean)
      .join(" | ");

    return NextResponse.json(
      {
        message: "Booking cancelled successfully.",
        id: removed.id,
        notificationSummary: {
          recipientsCount: 1 + workerNotifications.length,
          sentToCustomer: true,
          sentToWorkers: workerNotifications.length,
          warning: mergedWarning || null,
        },
        emailSummary: {
          recipientsCount: emailSentCount,
          warning: emailWarning,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Could not cancel booking." },
      { status: 500 }
    );
  }
}
