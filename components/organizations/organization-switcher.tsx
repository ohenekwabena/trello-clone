"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import { getUserOrganizations } from "@/lib/actions/organizations";
import type { OrganizationWithRole } from "@/lib/types/organization";
import { cn } from "@/lib/utils";

interface OrganizationSwitcherProps {
  currentOrgId?: string;
}

export function OrganizationSwitcher({ currentOrgId }: OrganizationSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const result = await getUserOrganizations();
      if (result.success && result.data) {
        setOrganizations(result.data);
      }
    } catch (err) {
      console.error("Error loading organizations:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentOrg = organizations.find((org) => org.id === currentOrgId);

  const handleSelectOrg = (orgId: string) => {
    setIsOpen(false);
    router.push(`/protected/organizations/${orgId}`);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push("/protected/organizations");
  };

  if (loading || organizations.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
          "hover:bg-neutral-100 dark:hover:bg-neutral-800",
          "border border-neutral-200 dark:border-neutral-700",
          "lg:min-w-[200px]"
        )}
      >
        <Building2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        <span className="flex-1 text-left text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate hidden lg:inline">
          {currentOrg?.name || "Select Organization"}
        </span>
        <ChevronDown
          className={cn("w-4 h-4 text-neutral-600 dark:text-neutral-400 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 w-full min-w-[280px] bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-800 z-50 overflow-hidden"
            >
              <div className="p-2 border-b border-neutral-200 dark:border-neutral-800">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 px-2 py-1">
                  Your Organizations
                </p>
              </div>

              <div className="max-h-[300px] overflow-y-auto py-1">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleSelectOrg(org.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                      "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                      currentOrgId === org.id && "bg-neutral-50 dark:bg-neutral-800/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold",
                        "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
                      )}
                    >
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {org.name}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">{org.role}</div>
                    </div>
                    {currentOrgId === org.id && (
                      <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-800 p-2">
                <button
                  onClick={handleViewAll}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  View All Organizations
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
