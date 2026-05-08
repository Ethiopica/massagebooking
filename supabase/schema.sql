create extension if not exists "pgcrypto";

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  service_type text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

alter table public.bookings
add column if not exists customer_email text;

create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  recipient_type text not null check (recipient_type in ('customer', 'worker')),
  recipient_name text not null,
  recipient_email text not null,
  channel text not null default 'in_app',
  message text not null,
  status text not null default 'sent',
  created_at timestamptz not null default now()
);

create index if not exists bookings_start_at_idx on public.bookings (start_at);
create index if not exists bookings_end_at_idx on public.bookings (end_at);
create index if not exists notifications_booking_idx on public.notifications (booking_id);
create index if not exists notifications_recipient_idx on public.notifications (recipient_email);

insert into public.workers (full_name, email)
values ('Default Therapist', 'worker@example.com')
on conflict (email) do nothing;
