import AdminNav from "@/features/admin/components/AdminNav";
import { requireRole } from "@/lib/dal";

// La navegación del panel. Cada página y acción vuelve a exigir ADMIN por su cuenta.
const AdminLayout = async ({ children }: LayoutProps<"/admin">) => {
  await requireRole("ADMIN");
  return (
    <div className="flex flex-col gap-8">
      <AdminNav />
      {children}
    </div>
  );
};

export default AdminLayout;
