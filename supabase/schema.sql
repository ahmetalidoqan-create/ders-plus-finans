create table if not exists public.app_settings (
  id text primary key default 'default',
  academy_name text not null default 'Ders Plus',
  city text not null default '',
  currency text not null default 'TRY',
  logo_icon text not null default 'graduation',
  contact_phone text not null default '',
  contact_email text not null default '',
  address text not null default '',
  fixed_expenses_until text
);

create table if not exists public.students (
  id text primary key,
  full_name text not null,
  email text not null default '',
  phone text not null default '',
  parent_phone text not null default '',
  classroom text not null default '',
  course text not null default '',
  monthly_fee numeric not null default 0,
  agreement_total numeric not null default 0,
  down_payment numeric not null default 0,
  installment_count integer not null default 0,
  first_installment_date date,
  status text not null default 'active',
  joined_at date,
  photo_url text
);

create table if not exists public.teachers (
  id text primary key,
  full_name text not null,
  pay_type text not null default 'hourly',
  monthly_salary numeric not null default 0,
  hourly_rate numeric not null default 0
);

create table if not exists public.payments (
  id text primary key,
  student_id text not null references public.students(id) on delete cascade,
  amount numeric not null default 0,
  due_date date not null,
  paid_at date,
  status text not null default 'pending',
  method text,
  note text not null default '',
  kind text not null default 'other',
  installment_no integer
);

create table if not exists public.expenses (
  id text primary key,
  title text not null,
  category text not null,
  amount numeric not null default 0,
  date date not null,
  note text not null default '',
  method text not null default 'nakit'
);

create table if not exists public.teacher_lessons (
  id text primary key,
  teacher_id text not null references public.teachers(id) on delete cascade,
  date date not null,
  hours numeric not null default 0,
  note text not null default ''
);

create table if not exists public.receipts (
  id text primary key,
  receipt_no text not null,
  date date not null,
  student_id text,
  student_name text not null default '',
  classroom text not null default '',
  phone text not null default '',
  parent_phone text not null default '',
  description text not null default '',
  method_label text not null default '',
  agreement_total numeric not null default 0,
  paid_this numeric not null default 0,
  paid_total numeric not null default 0,
  remaining numeric not null default 0,
  remaining_installments integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.teacher_lessons enable row level security;
alter table public.receipts enable row level security;

drop policy if exists app_settings_all on public.app_settings;
drop policy if exists students_all on public.students;
drop policy if exists teachers_all on public.teachers;
drop policy if exists payments_all on public.payments;
drop policy if exists expenses_all on public.expenses;
drop policy if exists teacher_lessons_all on public.teacher_lessons;
drop policy if exists receipts_all on public.receipts;

create policy app_settings_all on public.app_settings for all using (true) with check (true);
create policy students_all on public.students for all using (true) with check (true);
create policy teachers_all on public.teachers for all using (true) with check (true);
create policy payments_all on public.payments for all using (true) with check (true);
create policy expenses_all on public.expenses for all using (true) with check (true);
create policy teacher_lessons_all on public.teacher_lessons for all using (true) with check (true);
create policy receipts_all on public.receipts for all using (true) with check (true);

do $$
declare
  tbl text;
begin
  foreach tbl in array array['app_settings','students','teachers','payments','expenses','teacher_lessons','receipts']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    exception when duplicate_object then
      null;
    end;
  end loop;
end $$;
