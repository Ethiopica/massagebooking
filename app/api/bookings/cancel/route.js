import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("id");

  if (!bookingId) {
    return new NextResponse("Missing booking id.", { status: 400 });
  }

  try {
    const requestUrl = new URL(request.url);
    const apiBase = `${requestUrl.protocol}//${requestUrl.host}`;
    const cancelResponse = await fetch(
      `${apiBase}/api/bookings?id=${encodeURIComponent(bookingId)}`,
      {
        method: "DELETE",
        cache: "no-store",
      }
    );
    const payload = await cancelResponse.json();

    if (!cancelResponse.ok) {
      return new NextResponse(
        `Could not cancel booking: ${payload.message || "Unknown error"}`,
        {
          status: cancelResponse.status,
        }
      );
    }

    return new NextResponse(
      "<h2>Booking cancelled successfully.</h2><p>ቀጠሮው በተሳካ ሁኔታ ተሰርዟል። የስረዛ ማሳወቂያ ካርድ ተልኳል።</p>",
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  } catch (error) {
    return new NextResponse(
      `Could not cancel booking: ${error.message || "Unknown error"}`,
      { status: 500 }
    );
  }
}
