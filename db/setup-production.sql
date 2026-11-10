-- Crea el rol y la base de datos de DevLingo en PRODUCCIÓN (Fedora).
-- Se ejecuta con db/setup-production.sh, que pasa la contraseña desde .env sin mostrarla.
-- Solo crea o ajusta lo de DevLingo: no toca ninguna otra base ni rol (p. ej. los de Melgar te escucha).
-- A diferencia de desarrollo, el rol NO tiene CREATEDB: en producción solo se usa `prisma migrate deploy`.

\getenv app_password APP_PASSWORD

SELECT format('CREATE ROLE devlingo_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'devlingo_app')
\gexec

-- Si el rol ya existía, deja su contraseña igual a la de .env.
SELECT format('ALTER ROLE devlingo_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L', :'app_password')
\gexec

SELECT 'CREATE DATABASE devlingo OWNER devlingo_app'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'devlingo')
\gexec

REVOKE ALL ON DATABASE devlingo FROM PUBLIC;
GRANT CONNECT, TEMPORARY ON DATABASE devlingo TO devlingo_app;
