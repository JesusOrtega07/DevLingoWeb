#!/usr/bin/env bash
# Crea el rol devlingo_app y la base devlingo en el PostgreSQL de Fedora (ver DEPLOY.md).
# Uso:  sudo bash /srv/devlingo/app/db/setup-production.sh
# La contraseña se lee de DATABASE_URL en .env y no se imprime ni aparece en la lista de procesos.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ $EUID -ne 0 ]]; then
  echo "Usa: sudo bash /srv/devlingo/app/db/setup-production.sh" >&2
  exit 1
fi

APP_PASSWORD="$(/opt/devlingo/node/bin/node -e '
const fs = require("fs");
const line = fs.readFileSync(".env", "utf8").split("\n").find((l) => l.startsWith("DATABASE_URL="));
if (!line) { console.error("Falta DATABASE_URL en .env"); process.exit(1); }
const url = new URL(line.slice("DATABASE_URL=".length).replace(/^"|"$/g, ""));
if (url.username !== "devlingo_app" || !url.password) { console.error("DATABASE_URL debe usar devlingo_app con contraseña"); process.exit(1); }
process.stdout.write(decodeURIComponent(url.password));
')"

sudo -u postgres APP_PASSWORD="$APP_PASSWORD" psql -X -d postgres -v ON_ERROR_STOP=1 -q < db/setup-production.sql

echo "Listo: rol devlingo_app y base devlingo creados (o actualizados)."
