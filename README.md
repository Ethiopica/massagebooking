# Massage Service Booking System

This is a Next.js booking system using Supabase as the database.

## Business rules

- Working days: Monday to Saturday
- Working hours: 09:00 to 19:00
- Booking slots cannot overlap
- Booking creation records notifications for both customers and workers

## 1) Install dependencies

```bash
npm install
```

## 2) Configure Supabase

1. Create a Supabase project.
2. Run the SQL from `supabase/schema.sql` in the Supabase SQL editor.
   - This creates `bookings`, `workers`, and `notifications` tables.
   - A default worker row is inserted (`worker@example.com`).
3. Copy `.env.example` to `.env.local`.
4. Fill in:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `NOTIFICATION_FROM_EMAIL` (optional, defaults to `SMTP_USER`)
   - `TEAM_NOTIFICATION_EMAIL` (optional, defaults to `geteneshtegegn23@gmail.com`)

## 3) Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Notes

- The landing page hero image is stored at `public/hero-massage.png`.
- Notifications are saved in Supabase inside the `notifications` table.
- New booking emails are sent to the customer plus all active workers when SMTP is configured.
