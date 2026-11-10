// Forma común de la respuesta de las server actions del panel de admin.
export type ActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Enlace de invitación recién creado: se muestra una sola vez. */
  link?: string;
};

export const initialActionState: ActionState = {};
