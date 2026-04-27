-- Create notes table
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  title text,
  content text,
  drawing text,
  userId uuid references auth.users not null,
  createdAt timestamp with time zone default now(),
  updatedAt timestamp with time zone default now()
);

-- Enable row level security
alter table public.notes enable row level security;

-- Create function for updatedAt trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updatedAt = now();
  return new;
end;
$$ language 'plpgsql';

-- Create updatedAt trigger
create trigger update_notes_updated_at
  before update on public.notes
  for each row
  execute procedure update_updated_at_column();

-- Create policies for notes table
create policy "Users can view their own notes"
  on public.notes for select
  using (auth.uid() = userId);

create policy "Users can insert their own notes"
  on public.notes for insert
  with check (auth.uid() = userId);

create policy "Users can update their own notes"
  on public.notes for update
  using (auth.uid() = userId);

create policy "Users can delete their own notes"
  on public.notes for delete
  using (auth.uid() = userId);