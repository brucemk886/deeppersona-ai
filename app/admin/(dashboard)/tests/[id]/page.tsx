import { TestEditorPanel } from "@/app/admin/_components/test-editor";

export const dynamic = "force-dynamic";

export default async function AdminTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TestEditorPanel testId={decodeURIComponent(id)} />;
}
