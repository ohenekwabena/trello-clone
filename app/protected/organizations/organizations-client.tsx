"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganizationCardSkeleton } from "@/components/ui/loading-skeletons";
import { EmptyStateCard } from "@/components/ui/empty-state";
import { getUserOrganizations } from "@/lib/actions/organizations";
import { OrganizationCard } from "@/components/organizations/organization-card";
import { CreateOrganizationModal } from "@/components/organizations/create-organization-modal";
import type { OrganizationWithRole } from "@/lib/types/organization";
import toast from "react-hot-toast";

export function OrganizationsClient() {
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrganizations();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close modal
      if (e.key === "Escape" && isCreateModalOpen) {
        setIsCreateModalOpen(false);
      }
      // Ctrl/Cmd + K to create organization
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreateModalOpen]);

  const loadOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUserOrganizations();
      if (result.success && result.data) {
        setOrganizations(result.data);
      } else {
        setError(result.error || "Failed to load organizations");
        toast.error(result.error || "Failed to load organizations");
      }
    } catch (err) {
      console.error("Error loading organizations:", err);
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-5 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <OrganizationCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <EmptyStateCard
          icon={Building2}
          title="Unable to load organizations"
          description={error}
          actionLabel="Try Again"
          onAction={loadOrganizations}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Organizations</h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            Manage your organizations and collaborate with your team
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Organization
        </Button>
      </motion.div>

      {/* Organizations Grid */}
      {organizations.length === 0 ? (
        <EmptyStateCard
          icon={Building2}
          title="No organizations yet"
          description="Create your first organization to start collaborating with your team"
          actionLabel="Create Organization"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org, index) => (
            <OrganizationCard key={org.id} organization={org} index={index} />
          ))}
        </div>
      )}

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadOrganizations}
      />
    </div>
  );
}
