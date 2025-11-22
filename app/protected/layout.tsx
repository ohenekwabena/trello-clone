import { DeployButton } from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { OrganizationSwitcher } from "@/components/organizations/organization-switcher";
import Link from "next/link";
import { Suspense } from "react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 w-full flex flex-col">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Trello Clone</Link>
              <Link
                href={"/protected/dashboard"}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <OrganizationSwitcher />
            </div>

            <Suspense>
              <div className="flex gap-2 items-center">
                <ThemeSwitcher />
                <AuthButton />
              </div>
            </Suspense>
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-7xl w-full px-5">{children}</div>

        <footer className="w-full flex flex-col md:flex-row items-center justify-center border-t mx-auto text-center text-xs gap-2 md:gap-8 py-16">
          <p className="font-semibold">Trello Clone</p>
          <p>•</p>
          <p>A project management and collaboration tool</p>
          <p>•</p>
          <p>© 2025 All rights reserved</p>
        </footer>
      </div>
    </main>
  );
}
