create table patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ci text,
  phone text,
  birth_date date,
  gender text default 'female',
  height numeric,
  weight numeric,
  clinical_history text,
  medications text,
  notes text,
  is_pediatric boolean default false,
  tutor_name text,
  tutor_phone text,
  meal_plan text default '3+2 snacks',
  tags text[] default '{}',
  goal text default 'Nuevo Paciente',
  status text default 'Activo',
  onboarding_answers jsonb default '{}',
  measurements jsonb default '{}',
  menu jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table patient_history_entries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  entry jsonb not null,
  created_at timestamptz default now()
);

create table patient_reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz default now()
);

-- RLS
alter table patients enable row level security;
alter table patient_history_entries enable row level security;
alter table patient_reports enable row level security;
create policy "allow all (dev)" on patients for all using (true) with check (true);
create policy "allow all (dev)" on patient_history_entries for all using (true) with check (true);
create policy "allow all (dev)" on patient_reports for all using (true) with check (true);
