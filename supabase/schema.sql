-- ============================================================
-- New Life Laundry Manager — Supabase schema
-- Run this once in Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ---------- BUSINESS PROFILE (Settings) ----------
create table if not exists business_profile (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  business_name text default 'New Life Dyers & Cleaners',
  tagline text default 'Premium Dry Cleaning Services',
  address text,
  phone text,
  email text,
  website text,
  currency text default 'INR',
  low_stock_alerts boolean default true,
  created_at timestamptz default now()
);

-- ---------- CUSTOMERS ----------
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  address text,
  tag text default 'Regular', -- Regular / VIP
  status text default 'Active', -- Active / Inactive
  created_at timestamptz default now()
);

-- ---------- SERVICES ----------
create table if not exists services (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text,
  price numeric(10,2) default 0,
  est_time text,
  description text,
  status text default 'Active',
  created_at timestamptz default now()
);

-- ---------- STAFF ----------
create table if not exists staff (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  employee_id text,
  department text,
  role text,
  phone text,
  email text,
  status text default 'Active', -- Active / On Leave / Inactive
  join_date date default current_date,
  salary numeric(10,2),
  created_at timestamptz default now()
);

-- ---------- ORDERS ----------
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  order_no text not null,
  customer_id uuid references customers(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  status text default 'Pending', -- Pending / In Process / Ready / Delivered / Cancelled
  payment_status text default 'Unpaid', -- Paid / Unpaid
  order_date timestamptz default now(),
  total_amount numeric(10,2) default 0,
  discount numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade not null,
  item_name text not null,
  service_name text,
  qty integer default 1,
  price numeric(10,2) default 0
);

-- ---------- INVOICES ----------
create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  invoice_no text not null,
  order_id uuid references orders(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  amount numeric(10,2) default 0,
  status text default 'Pending', -- Paid / Pending
  payment_mode text default 'Cash',
  invoice_date timestamptz default now(),
  created_at timestamptz default now()
);

-- ---------- DELIVERY ----------
create table if not exists deliveries (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  delivery_no text not null,
  order_id uuid references orders(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  staff_id uuid references staff(id) on delete set null,
  address text,
  status text default 'Pending', -- Pending / Out for Delivery / Delivered / Cancelled
  eta text,
  delivered_at timestamptz,
  created_at timestamptz default now()
);

-- ---------- INVENTORY ----------
create table if not exists inventory (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  item_name text not null,
  category text,
  sku text,
  stock numeric(10,2) default 0,
  unit text default 'Pcs',
  unit_price numeric(10,2) default 0,
  reorder_level numeric(10,2) default 0,
  supplier text,
  created_at timestamptz default now()
);

create table if not exists stock_history (
  id uuid primary key default uuid_generate_v4(),
  inventory_id uuid references inventory(id) on delete cascade not null,
  change_qty numeric(10,2) not null, -- positive = added, negative = used
  reason text,
  created_at timestamptz default now()
);

-- ---------- EXPENSES ----------
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  expense_name text not null,
  category text,
  vendor text,
  amount numeric(10,2) default 0,
  payment_mode text default 'Cash',
  status text default 'Paid', -- Paid / Unpaid
  expense_date date default current_date,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Every table is scoped to owner_id = auth.uid() so each signed-in
-- shop owner only ever sees their own data.
-- ============================================================
alter table business_profile enable row level security;
alter table customers enable row level security;
alter table services enable row level security;
alter table staff enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table invoices enable row level security;
alter table deliveries enable row level security;
alter table inventory enable row level security;
alter table stock_history enable row level security;
alter table expenses enable row level security;

-- Generic "owner can do everything with their own rows" policy,
-- repeated per table (order_items/stock_history inherit via join).

create policy "owner_all_business_profile" on business_profile
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner_all_customers" on customers
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner_all_services" on services
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner_all_staff" on staff
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner_all_orders" on orders
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner_all_invoices" on invoices
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner_all_deliveries" on deliveries
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner_all_inventory" on inventory
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner_all_expenses" on expenses
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner_all_order_items" on order_items
  for all using (
    exists (select 1 from orders o where o.id = order_items.order_id and o.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from orders o where o.id = order_items.order_id and o.owner_id = auth.uid())
  );

create policy "owner_all_stock_history" on stock_history
  for all using (
    exists (select 1 from inventory i where i.id = stock_history.inventory_id and i.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from inventory i where i.id = stock_history.inventory_id and i.owner_id = auth.uid())
  );

-- ============================================================
-- Helpful indexes
-- ============================================================
create index if not exists idx_orders_owner on orders(owner_id);
create index if not exists idx_customers_owner on customers(owner_id);
create index if not exists idx_invoices_owner on invoices(owner_id);
create index if not exists idx_deliveries_owner on deliveries(owner_id);
create index if not exists idx_inventory_owner on inventory(owner_id);
create index if not exists idx_expenses_owner on expenses(owner_id);
