# DevLingo Web

Plataforma web de DevLingo Community, una comunidad de práctica de inglés para estudiantes
de tecnología de la UNACH. Slogan: From "Hello, World!" to "Hello, everyone!"

Tiene inicio de sesión y crecerá con más secciones. La primera actividad es "Interviews":
entrevistas de trabajo simuladas que conduce y evalúa una English Expert. Esta actividad
NO es la página principal; vive en su propia ruta (ej. /activities/interviews).

## Roles
- admin: gestiona cuentas, integrantes, entrevistas y asignaciones desde el panel de admin.
- expert: English Experts (como Lili). Conducen y evalúan las entrevistas asignadas.
- member: integrantes. Solo ven su propio feedback cuando ya está guardado.

## Stack
- Next.js (App Router) + TypeScript, Tailwind CSS, Motion (motion/react).
- PostgreSQL con Prisma. Base de datos propia: `devlingo` con el usuario `devlingo_app`.

## Carpetas de referencia
- `design/`: mockups de cada pantalla exportados como `NN-nombre.dc.html`. Son referencia
  visual, no código para copiar: replica sus valores exactos (colores, tamaños, espaciados,
  radios, sombras) en tus propios componentes con Tailwind. Las rutas `./assets/...` de esos
  archivos apuntan al logo, que está en `public/logo.svg`.
  `03-family-selected` y `08-evaluation-saved` reutilizan la pantalla `02-family.dc.html`
  (`<dc-import name="Lili02Family" mode="selected|saved">`): son los estados de tarjeta
  seleccionada y de evaluación guardada de esa misma vista.
  Lee solo el mockup de la pantalla que estés construyendo en cada fase.
- `templates/interview-template.md`: plantilla oficial de los scripts de entrevista.
- `scripts/`: scripts .md de cada entrevista (el seed usa `jesus-junior-data-analyst.md`).
- `public/logo.svg`: logo de DevLingo. No modificar su forma ni sus colores.

## Scripts de entrevista (.md)
- El admin sube un .md por entrevista desde el panel. No se usan PDFs.
- Estructura obligatoria (ver la plantilla):
  - Frontmatter entre `---` con `member`, `interview` e `interest`.
  - Encabezados exactos: `## Context`, `## Script` y `## Score sheet`.
  - Tabla del Script: Time | Question | A good answer includes.
  - Tabla del Score sheet: Area | What to look at.
- Cada sección se convierte en su pestaña: Context, Script (pasos con tiempo, pregunta y
  "a good answer includes", más Opening y Closing) y Score sheet (apartados del formulario).
- Antes de guardar, mostrar una vista previa y avisar si falta una sección o una tabla
  no tiene el formato esperado.
- Guardar el .md original y la versión procesada. Se puede reemplazar subiendo otra versión.
- La edad del integrante no va en el .md: se captura en el panel de admin.

## Score sheet
- Sin puntuaciones numéricas: análisis escrito por apartado, en este orden: Fluency,
  Grammar, Vocabulary, Pronunciation y Confidence.
- Además: "Mistakes heard" (He said / Better, con filas dinámicas), Strength,
  Top 2 to improve y Next round? (Yes / Maybe / No).
- Al guardar, el estado del integrante pasa de "Pending" a "Interviewed".

## Reglas de código
- Componentes de React SIEMPRE como arrow functions, nunca `export function`:
  `const MemberCard = ({ member }: Props) => { ... }` y al final `export default MemberCard`.
  Lo mismo en páginas y layouts de Next.js (`const Page = () => {...}; export default Page`).
- Diseño: fondo #141417, dorado #D7A361, crema #FDF3E6. Tipografías: Montserrat y
  JetBrains Mono. Animaciones suaves con Motion, sin exagerar.

## Seguridad (obligatorio)
- Nunca SQL concatenado. Solo Prisma o queries parametrizadas; nada de `$queryRawUnsafe`.
- Validar toda entrada con zod en el servidor (server actions y route handlers).
- Contraseñas con argon2 o bcrypt. Sesiones en cookies httpOnly, secure y sameSite.
- Límite de intentos de login (rate limiting) y bloqueo temporal.
- Autorización por rol en el servidor en cada acción y ruta, no solo ocultando botones.
  Un member nunca puede ver datos de otro member.
- Archivos .md: solo extensión .md, máximo 1 MB, markdown renderizado sin HTML crudo
  (sanitizado) y nunca ejecutar nada de su contenido.
- Nunca `dangerouslySetInnerHTML`. Los enlaces guardados solo pueden ser https://.
- Headers de seguridad (CSP, X-Frame-Options, etc.). Secretos solo en `.env`, nunca en git.

## Servidor (NO tocar Melgar te escucha)
- Producción en una máquina Fedora donde también corre "Melgar te escucha" (Node directo,
  expuesto con ngrok). DevLingo es un proyecto aparte: otro puerto, otra base de datos,
  otro proceso y otro .env. Nunca modificar archivos, procesos, puerto, túnel ni base de
  datos de Melgar te escucha.
- DevLingo corre como servicio que se reinicia solo si se cae o si el equipo se reinicia.
- Flujo: desarrollo en Mac → push a GitHub → `git pull` en Fedora → `npm ci`,
  migraciones, build y reinicio del servicio (documentado en DEPLOY.md).
