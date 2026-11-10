import AppHeader from "@/components/layout/AppHeader";
import { requireUser } from "@/lib/dal";

// Marco de las páginas con sesión. Cada página vuelve a exigir sesión/rol por su cuenta:
// el layout no se re-renderiza en cada navegación, así que no basta como protección.
// Cada página pone su propio contenedor (PageContainer), porque algunas vistas tienen
// franjas a todo el ancho (encabezado de la entrevista).
const AppLayout = async ({ children }: LayoutProps<"/">) => {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader user={user} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
};

export default AppLayout;
