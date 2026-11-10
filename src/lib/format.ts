// Fechas en la zona horaria de la comunidad (UNACH, Chiapas), igual en servidor y cliente.
const TIME_ZONE = "America/Mexico_City";

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: TIME_ZONE }).format(date);

export const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: TIME_ZONE }).format(date);
