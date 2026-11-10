-- Crea el rol y la base de datos de DevLingo para DESARROLLO LOCAL (Mac).
-- Se ejecuta con db/setup-local.sh, que pasa la contraseña desde .env sin mostrarla.
-- En desarrollo el rol tiene CREATEDB porque `prisma migrate dev` necesita una shadow database.
-- En producción (Fedora) el rol se crea SIN CREATEDB: ver DEPLOY.md.

SELECT 'CREATE ROLE devlingo_app LOGIN CREATEDB PASSWORD ' || quote_literal(:'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'devlingo_app')
\gexec

SELECT 'CREATE DATABASE devlingo OWNER devlingo_app'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'devlingo')
\gexec

REVOKE ALL ON DATABASE devlingo FROM PUBLIC;
GRANT CONNECT, TEMPORARY ON DATABASE devlingo TO devlingo_app;
