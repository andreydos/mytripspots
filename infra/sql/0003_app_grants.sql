-- Run as postgres superuser after 0001_init.sql when the API uses a dedicated role.
-- Example: psql -U postgres -d mytripspots -f 0003_app_grants.sql
-- Replace mytripspots if your app role name differs.

grant usage on schema public to mytripspots;
grant select, insert, update, delete on all tables in schema public to mytripspots;
grant usage, select on all sequences in schema public to mytripspots;
alter default privileges in schema public grant select, insert, update, delete on tables to mytripspots;
alter default privileges in schema public grant usage, select on sequences to mytripspots;
