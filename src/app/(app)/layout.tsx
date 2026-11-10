import AppHeader from "@/components/layout/AppHeader";
import { requireUser } from "@/lib/dal";

// Marco de las páginas con sesión. Cada página vuelve a exigir sesión/rol por su cuenta:
// el layout no se re-renderiza en cada navegación, así que no basta como protección.
const AppLayout = async ({ children }: LayoutProps<"/">) => {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
};

export default AppLayout;
