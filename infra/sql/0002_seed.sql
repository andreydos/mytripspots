insert into users (id, clerk_user_id, email, display_name)
values
  ('11111111-1111-1111-1111-111111111111', 'user_demo_1', 'demo@example.com', 'Demo User')
on conflict (clerk_user_id) do nothing;

insert into trips (id, owner_id, title, description, visibility)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Demo Trip', 'Seeded local trip', 'private')
on conflict (id) do nothing;

insert into places (id, trip_id, lat, lng, title, notes)
values
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 51.5072, -0.1276, 'London', 'Seed place')
on conflict (id) do nothing;
