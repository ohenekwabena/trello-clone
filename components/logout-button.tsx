"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div onClick={logout} className="flex items-center cursor-pointer w-full px-3 py-1">
      <LogOut className="mr-3 h-4 w-4" />
      <span>Log out</span>
    </div>
  );
}
