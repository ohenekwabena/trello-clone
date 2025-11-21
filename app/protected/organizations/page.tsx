import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrganizationsClient } from "./organizations-client";

export default async function OrganizationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <OrganizationsClient />;
}
