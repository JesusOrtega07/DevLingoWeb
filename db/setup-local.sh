#!/usr/bin/env bash
# Crea el rol devlingo_app y la base devlingo en el Postgres local.
# Pide la contraseña del superusuario "postgres" (la escribes tú en la terminal).
# La contraseña de devlingo_app se lee de DATABASE_URL en .env y no se imprime.
set -euo pipefail
cd "$(dirname "$0")/.."

APP_PASSWORD="$(node -e '
const fs = require("fs");
const line = fs.readFileSync(".env", "utf8").split("\n").find((l) => l.startsWith("DATABASE_URL="));
if (!line) { console.error("Falta DATABASE_URL en .env"); process.exit(1); }
const url = new URL(line.slice("DATABASE_URL=".length).replace(/^"|"$/g, ""));
process.stdout.write(decodeURIComponent(url.password));
')"

psql -h localhost -U "${PGSUPERUSER:-postgres}" -d postgres -v ON_ERROR_STOP=1 \
  -v app_password="$APP_PASSWORD" -f db/setup-local.sql

echo "Listo: rol devlingo_app y base devlingo creados (o ya existían)."
