import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrganization } from "@/lib/actions/organizations";
import { OrganizationDetailClient } from "./organization-detail-client";

interface OrganizationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Await params before accessing its properties
  const { id } = await params;

  const result = await getOrganization(id);

  if (!result.success || !result.data) {
    redirect("/protected/organizations");
  }

  return <OrganizationDetailClient organization={result.data} />;
}
