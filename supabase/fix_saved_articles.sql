-- Enable the uuid-ossp extension if not already enabled
create extension if not exists "uuid-ossp";

-- Add a unique constraint to prevent duplicate saved articles for the same user
-- This is critical for the upsert/check logic to work correctly
alter table public.saved_articles 
add constraint saved_articles_user_id_url_key unique (user_id, url);

-- Ensure the id column has a default value (if it was created without one or if the extension was missing)
alter table public.saved_articles 
alter column id set default uuid_generate_v4();

-- Verify RLS policies exist (re-creating them is safe if we use IF NOT EXISTS or drop first, but let's just ensure they are enabled)
alter table public.saved_articles enable row level security;
