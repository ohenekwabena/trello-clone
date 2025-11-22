import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBoard } from "@/lib/actions/boards";
import { BoardDetailClient } from "./board-detail-client";

interface BoardPageProps {
  params: Promise<{
    id: string;
    boardId: string;
  }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Await params before accessing its properties
  const { id, boardId } = await params;

  const result = await getBoard(boardId);

  if (!result.success || !result.data) {
    redirect(`/protected/organizations/${id}`);
  }

  // Verify the board belongs to the organization
  if (result.data.org_id !== id) {
    redirect(`/protected/organizations/${id}`);
  }

  return <BoardDetailClient board={result.data} role={result.role!} />;
}
