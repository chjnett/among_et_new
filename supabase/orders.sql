-- Create Orders Table
create table orders (
  id uuid default uuid_generate_v4() primary key,
  customer_name text not null,
  contact text not null,
  address text not null,
  product_name text not null,
  status text default 'pending', -- pending, processing, completed, cancelled
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table orders enable row level security;

-- Admin Full Access
create policy "Allow admin full access on orders"
  on orders
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- For now, allow public insert (so customers can order without login)
create policy "Allow public insert on orders"
  on orders
  for insert
  with check (true);
