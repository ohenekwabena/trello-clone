import { SetPasswordForm } from "@/components/set-password-form";
import { Suspense } from "react";

function SetPasswordContent() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-neutral-950 dark:to-neutral-900">
      <div className="w-full max-w-sm">
        <SetPasswordForm />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SetPasswordContent />
    </Suspense>
  );
}
