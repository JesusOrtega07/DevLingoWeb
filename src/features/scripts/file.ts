// Validación del archivo subido, antes de leer su contenido.

export const MAX_SCRIPT_BYTES = 1024 * 1024; // 1 MB

export type FileCheck = { ok: true; text: string } | { ok: false; error: string };

/**
 * Solo .md, máximo 1 MB, UTF-8 válido y sin bytes nulos.
 * Devuelve el texto con saltos de línea normalizados a \n y sin BOM.
 */
export const readMarkdownFile = (fileName: string, bytes: Uint8Array): FileCheck => {
  const name = fileName.trim();
  if (!/^[^/\\]{1,200}\.md$/i.test(name)) {
    return { ok: false, error: "Only .md files are allowed." };
  }
  if (bytes.byteLength === 0) {
    return { ok: false, error: "The file is empty." };
  }
  if (bytes.byteLength > MAX_SCRIPT_BYTES) {
    return { ok: false, error: "The file is larger than 1 MB." };
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, error: "The file is not valid UTF-8 text." };
  }
  if (text.includes("\u0000")) {
    return { ok: false, error: "The file contains binary data." };
  }

  text = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  return { ok: true, text };
};
