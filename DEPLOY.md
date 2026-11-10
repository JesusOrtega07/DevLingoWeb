# Despliegue de DevLingo en Fedora (Tailscale Funnel)

DevLingo se publica con **Tailscale Funnel**: gratis, sin dominio propio y con HTTPS. La URL
pública queda fija, del tipo `https://devlingo.<tu-tailnet>.ts.net`.

```
Internet ──HTTPS──▶ Tailscale Funnel ──▶ tailscaled (Fedora) ──▶ 127.0.0.1:3100 (servicio devlingo) ──▶ PostgreSQL: base devlingo
```

## Lo que NUNCA se toca: Melgar te escucha

Melgar te escucha corre en esta misma máquina (Node directo, expuesto con ngrok). DevLingo
está separado en todo:

| | Melgar te escucha | DevLingo |
|---|---|---|
| Código | el suyo | `/srv/devlingo/app` |
| Usuario del sistema | el suyo | `devlingo` |
| Node | el del sistema | propio, en `/opt/devlingo/node` |
| Puerto | el suyo | `127.0.0.1:3100` |
| Túnel | ngrok | Tailscale Funnel |
| Base de datos | la suya | `devlingo` (rol `devlingo_app`) |
| Servicio | el suyo | `devlingo.service` |
| `.env` | el suyo | `/srv/devlingo/app/.env` |

No reinicies, edites ni detengas nada de Melgar. No actualices el Node del sistema con
`dnf`, porque Melgar lo usa. Si PostgreSQL ya existe porque Melgar lo usa, **no** lo
reinstales ni lo reinicies: aquí solo se *añade* la base de DevLingo y, como mucho, se
*recarga* la configuración (eso no corta conexiones).

Todos los comandos se pegan en la terminal de Fedora con tu usuario normal (el que tiene `sudo`).

---

## 1. Antes de empezar

**En la Mac**, sube el código a GitHub:

```bash
git push -u origin main
```

**En Fedora**, comprueba lo básico. Todo esto es solo lectura:

```bash
# El puerto 3100 debe estar libre (si sale una línea, avísame antes de seguir)
sudo ss -ltnp | grep -E ':3100\b' || echo "3100 libre"

# Arquitectura: x86_64 o aarch64
uname -m

# ¿Ya hay PostgreSQL? (por ejemplo, porque lo usa Melgar)
systemctl list-unit-files 'postgresql*' --no-pager
```

## 2. Tailscale y la URL pública

Si Tailscale ya está instalado en Fedora, salta al `tailscale up`.

```bash
# Fedora 41 o más nuevo (dnf5):
sudo dnf config-manager addrepo --from-repofile=https://pkgs.tailscale.com/stable/fedora/tailscale.repo
# Fedora 40 o anterior, en su lugar:
#   sudo dnf config-manager --add-repo https://pkgs.tailscale.com/stable/fedora/tailscale.repo

sudo dnf install -y tailscale
sudo systemctl enable --now tailscaled

# Imprime un enlace: ábrelo en la Mac e inicia sesión (o crea la cuenta gratuita).
sudo tailscale up --hostname=devlingo
```

Anota la URL pública que tendrá DevLingo:

```bash
echo "https://$(tailscale status --json | python3 -c 'import json,sys; print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))')"
```

Ejemplo: `https://devlingo.tail1234.ts.net`. Si el nombre `devlingo` ya estaba ocupado en tu
cuenta, puede salir `devlingo-1`; usa lo que imprima.

## 3. Usuario `devlingo`

```bash
sudo useradd --system --home-dir /srv/devlingo --create-home --shell /sbin/nologin devlingo
sudo chmod 750 /srv/devlingo
```

## 4. Node de DevLingo (aislado del sistema)

Se baja el Node oficial (rama 26 LTS) y se comprueba su checksum. Queda en
`/opt/devlingo/node`; el Node del sistema no se toca.

```bash
ARCH=$(uname -m | sed 's/x86_64/x64/; s/aarch64/arm64/')
BASE=https://nodejs.org/dist/latest-v26.x
FILE=$(curl -fsSL "$BASE/SHASUMS256.txt" | grep -o "node-v[0-9.]*-linux-$ARCH.tar.xz" | head -1)
cd /tmp && curl -fsSLO "$BASE/$FILE"
curl -fsSL "$BASE/SHASUMS256.txt" | grep " $FILE\$" | sha256sum -c -
sudo mkdir -p /opt/devlingo/node
sudo tar -xJf "$FILE" -C /opt/devlingo/node --strip-components=1 && rm "$FILE"
/opt/devlingo/node/bin/node -v
```

`sha256sum` debe decir `OK`.

## 5. Código

Trabaja desde `/tmp`. El usuario `devlingo` no puede leer tu carpeta personal, y `git`
falla si arranca en una carpeta que no puede leer:

```bash
cd /tmp
```

**Si el repo de GitHub es público:**

```bash
sudo -u devlingo git clone https://github.com/JesusOrtega07/DevLingoWeb.git /srv/devlingo/app
```

**Si es privado**, crea una *deploy key* de solo lectura para el usuario `devlingo`:

```bash
sudo -u devlingo mkdir -m 700 -p /srv/devlingo/.ssh
sudo -u devlingo ssh-keygen -t ed25519 -N "" -C devlingo-deploy -f /srv/devlingo/.ssh/id_ed25519
sudo cat /srv/devlingo/.ssh/id_ed25519.pub
```

Copia la línea que sale. En GitHub ve a **Settings → Deploy keys → Add deploy key**, pégala
y deja **sin marcar** "Allow write access". Luego:

```bash
sudo -u devlingo git clone git@github.com:JesusOrtega07/DevLingoWeb.git /srv/devlingo/app
```

Cuando pregunte si confías en `github.com`, responde `yes`.

Instala los dos ayudantes. Se copian fuera del repo, con dueño root, para que el usuario
`devlingo` no pueda modificarlos:

```bash
sudo install -m 755 /srv/devlingo/app/deploy/devlingo-app /usr/local/sbin/devlingo-app
sudo install -m 755 /srv/devlingo/app/deploy/devlingo-update /usr/local/sbin/devlingo-update
```

`/srv/devlingo` solo lo puede abrir el usuario `devlingo`; por eso los comandos usan rutas
completas con `sudo` en lugar de `cd`.

## 6. `.env` de producción

Cambia **solo** las tres líneas marcadas (URL del paso 2, tu correo y tu nombre). La
contraseña de la base se genera sola y nunca aparece en pantalla.

```bash
PASS=$(openssl rand -hex 24)
sudo -u devlingo tee /srv/devlingo/app/.env > /dev/null <<EOF
DATABASE_URL="postgresql://devlingo_app:${PASS}@127.0.0.1:5432/devlingo?schema=public"
APP_URL="https://devlingo.TU-TAILNET.ts.net"
SEED_ADMIN_EMAIL="tu-correo@ejemplo.com"
SEED_ADMIN_NAME="Tu nombre"
EOF
unset PASS
sudo chmod 600 /srv/devlingo/app/.env
```

Las tres líneas a cambiar son `APP_URL` (la URL del paso 2), `SEED_ADMIN_EMAIL` y
`SEED_ADMIN_NAME`.

`TRUSTED_PROXY_HEADER` se queda **sin poner** por ahora (ver el paso 12).

Para corregir algo después: `sudo -u devlingo nano /srv/devlingo/app/.env` y luego
`sudo systemctl restart devlingo`.

## 7. PostgreSQL

**Solo si en el paso 1 no apareció ningún `postgresql.service`**, instálalo:

```bash
sudo dnf install -y postgresql-server postgresql
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql
```

Si ya existía, **no** ejecutes eso.

Crea el rol y la base de DevLingo. Solo crea lo suyo y no toca otras bases:

```bash
sudo bash /srv/devlingo/app/db/setup-production.sh
```

Permite que `devlingo_app` entre con contraseña, solo a la base `devlingo`. Fedora trae por
defecto `ident`, que no funciona con contraseña. Se añaden dos líneas al principio de
`pg_hba.conf`, se guarda una copia y se **recarga** (no se reinicia):

```bash
HBA=$(sudo -u postgres psql -XtAc 'SHOW hba_file')
sudo cp -a "$HBA" "$HBA.antes-devlingo"
sudo awk '!done && /^[[:space:]]*(local|host)/ {
  print "# DevLingo: solo la base devlingo, solo con contraseña, solo desde esta máquina"
  print "host  devlingo  devlingo_app  127.0.0.1/32  scram-sha-256"
  print "host  devlingo  devlingo_app  ::1/128       scram-sha-256"
  done=1 } { print }' "$HBA.antes-devlingo" | sudo tee "$HBA" > /dev/null
sudo -u postgres psql -XtAc 'SELECT pg_reload_conf()'
```

Esas líneas solo aplican a la base `devlingo` con el rol `devlingo_app`, así que las
conexiones de Melgar siguen igual.

Comprueba la conexión. Debe decir que hay migraciones pendientes, no un error de autenticación:

```bash
sudo devlingo-app npx prisma migrate status
```

## 8. Instalar, migrar y compilar

```bash
sudo devlingo-app npm ci
sudo devlingo-app npx prisma migrate deploy
sudo devlingo-app npm run build
```

## 9. Servicio systemd

```bash
sudo install -m 644 /srv/devlingo/app/deploy/devlingo.service /etc/systemd/system/devlingo.service
sudo systemctl daemon-reload
sudo systemctl enable --now devlingo
systemctl status devlingo --no-pager
curl -sI http://127.0.0.1:3100/login | head -1     # debe decir: HTTP/1.1 200 OK
```

`enable` hace que arranque solo cuando se reinicia el equipo. `Restart=always` lo levanta
de nuevo si se cae.

## 10. Publicar con Funnel

```bash
sudo tailscale funnel --bg 3100
```

La primera vez imprime un enlace para activar Funnel y HTTPS en tu cuenta de Tailscale.
Ábrelo, acéptalo y repite el comando. `--bg` deja Funnel puesto aunque reinicies el equipo.

```bash
tailscale funnel status
```

Abre la URL desde tu celular con datos móviles (sin Wi-Fi) para confirmar que se ve desde fuera.

No hace falta abrir ningún puerto en el firewall: el puerto 3100 solo escucha en
127.0.0.1 y Tailscale sale hacia internet, no recibe conexiones directas.

## 11. Primera cuenta admin

```bash
sudo devlingo-app env NODE_ENV=production npm run db:seed
```

Imprime **una vez** un enlace de un solo uso (72 h) para la cuenta de `SEED_ADMIN_EMAIL`.
Ábrelo, define tu contraseña y entra. En producción no se crean los datos demo (Lili, Jesús).
Desde el panel de admin creas a las English Experts y a los integrantes.

Si el enlace se pierde o caduca, o si olvidas la contraseña:

```bash
sudo devlingo-app npm run access-link -- tu-correo@ejemplo.com
```

## 12. (Recomendado) IP real para el límite de intentos de login

Sin `TRUSTED_PROXY_HEADER`, el límite de login funciona por correo y por cuenta: 5 fallos
bloquean esa cuenta 15 minutos. Con la IP real, además se limitan 20 fallos por IP. Antes
de activarlo hay que comprobar que Tailscale pone la IP real en `X-Forwarded-For`. Si un
visitante pudiera falsificarla, el límite por IP no serviría.

Primero comprueba que el puerto 3199 esté libre:

```bash
sudo ss -ltnp | grep -E ':3199\b' || echo "3199 libre"
```

**Terminal 1** — un servidor temporal que muestra los headers que llegan:

```bash
python3 - <<'EOF'
from http.server import BaseHTTPRequestHandler, HTTPServer
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        body = "".join(f"{k}: {v}\n" for k, v in self.headers.items() if k.lower().startswith("x-forwarded")).encode()
        self.send_response(200); self.send_header("Content-Type", "text/plain"); self.end_headers(); self.wfile.write(body)
HTTPServer(("127.0.0.1", 3199), H).serve_forever()
EOF
```

**Terminal 2** — publícalo un momento en una ruta aparte:

```bash
sudo tailscale funnel --bg --set-path=/__headers 3199
```

**Desde la Mac** (fuera de la red de Tailscale; mejor con el hotspot del celular), envía una IP falsa:

```bash
curl -s -H 'X-Forwarded-For: 9.9.9.9' https://devlingo.TU-TAILNET.ts.net/__headers
```

Mira el **último** valor de `X-Forwarded-For`:

- Es tu IP pública real (búscala como "what is my ip"): Tailscale es confiable y puedes activarlo:
  ```bash
  echo 'TRUSTED_PROXY_HEADER="x-forwarded-for"' | sudo -u devlingo tee -a /srv/devlingo/app/.env > /dev/null
  sudo systemctl restart devlingo
  ```
- Es `9.9.9.9` o no aparece el header: **no** lo actives. La app sigue protegida sin él.

Al terminar, en cualquier caso, quita la ruta temporal y detén el servidor de la terminal 1 con `Ctrl+C`:

```bash
sudo tailscale funnel --https=443 --set-path=/__headers off
tailscale funnel status     # solo debe quedar / → http://127.0.0.1:3100
```

---

## Actualizar (cada vez que haya cambios)

En la Mac: commit y `git push`. En Fedora:

```bash
sudo devlingo-update
```

Hace `git pull` → `npm ci` → migraciones → build → reinicio, y comprueba que responda.
Durante el build y el reinicio la página puede fallar unos segundos.

Si cambió algún archivo de `deploy/`, vuelve a instalarlo después del update:

```bash
sudo install -m 755 /srv/devlingo/app/deploy/devlingo-app /usr/local/sbin/devlingo-app
sudo install -m 755 /srv/devlingo/app/deploy/devlingo-update /usr/local/sbin/devlingo-update
sudo install -m 644 /srv/devlingo/app/deploy/devlingo.service /etc/systemd/system/devlingo.service
sudo systemctl daemon-reload && sudo systemctl restart devlingo
```

## Comandos útiles

```bash
systemctl status devlingo --no-pager      # ¿está corriendo?
sudo journalctl -u devlingo -f            # logs en vivo (Ctrl+C para salir)
sudo systemctl restart devlingo           # reiniciar solo DevLingo
tailscale funnel status                   # ¿qué está publicado?
sudo devlingo-app npm run access-link -- correo@ejemplo.com   # enlace para (re)definir contraseña
```

## Problemas comunes

- **`status=226/NAMESPACE` al arrancar el servicio**: falta la carpeta `.next`. Ejecuta
  `sudo devlingo-app npm run build` y reinicia.
- **`Ident authentication failed` o `password authentication failed`**: revisa el paso 7
  (`pg_hba.conf`). Si cambiaste la contraseña en `.env`, vuelve a correr
  `sudo bash /srv/devlingo/app/db/setup-production.sh`.
- **El enlace de invitación apunta a localhost o a otra URL**: corrige `APP_URL` en `.env`,
  reinicia y genera un enlace nuevo con `access-link`.
- **Bloqueo de SELinux** (sale `Permission denied` aunque los permisos estén bien):
  ```bash
  sudo ausearch -m avc -ts recent
  sudo dnf install -y policycoreutils-python-utils
  sudo semanage fcontext -a -t bin_t '/opt/devlingo/node/bin(/.*)?'
  sudo restorecon -Rv /opt/devlingo/node/bin
  ```
- **La URL pública no carga**: `tailscale funnel status` debe mostrar `/ → http://127.0.0.1:3100`
  y `curl -sI http://127.0.0.1:3100/login` debe dar 200. Si lo segundo falla, el problema es el
  servicio (`journalctl -u devlingo`), no el túnel.
