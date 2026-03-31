-- Create Reviews Table
create table reviews (
  id uuid default uuid_generate_v4() primary key,
  author_name text not null,
  content text not null,
  rating integer check (rating >= 1 and rating <= 5) default 5,
  image_url text,
  product_id uuid references products(id) on delete set null,
  is_visible boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table reviews enable row level security;

-- Public Read Access
create policy "Allow public read access on reviews"
  on reviews for select
  using (is_visible = true);

-- Admin Full Access
create policy "Allow admin full access on reviews"
  on reviews
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
