import { requireAdmin } from "@/lib/admin-session";
import { getFactoryPdf } from "@/services/machinery";
import FactoryPdfEditor from "@/components/admin/factory-pdf-editor";

export default async function MachineryFactoryPdfAdminPage() {
  await requireAdmin();
  const pdf = await getFactoryPdf();
  return <FactoryPdfEditor initialPdf={pdf} />;
}
