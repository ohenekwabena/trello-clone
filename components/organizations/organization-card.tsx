"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MoreVertical, Edit, Trash2, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrganizationWithRole } from "@/lib/types/organization";
import { deleteOrganization } from "@/lib/actions/organizations";
import { EditOrganizationModal } from "./edit-organization-modal";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrganizationCardProps {
  organization: OrganizationWithRole;
  index: number;
}

export function OrganizationCard({ organization, index }: OrganizationCardProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteOrganization(organization.id);
      if (result.success) {
        toast.success("Organization deleted successfully");
        setShowDeleteConfirm(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete organization. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isOwner = organization.role === "owner";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={cn(
          "group relative p-6 rounded-2xl border bg-white dark:bg-neutral-900 hover:shadow-lg transition-all duration-300",
          "border-neutral-200 dark:border-neutral-800",
          isDeleting && "opacity-50 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="w-12 h-12 flex-shrink-0">
              <AvatarFallback className="text-lg font-bold">
                {organization.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 max-w-full">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 truncate">
                {organization.name}
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-full",
                    organization.role === "owner"
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      : organization.role === "admin"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300"
                  )}
                >
                  {organization.role}
                </span>
              </div>
            </div>
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <MoreVertical className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Description */}
        {organization.description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">{organization.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
            <Users className="w-4 h-4" />
            <span>
              {organization.member_count || 0} member{organization.member_count !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(organization.created_at)}</span>
          </div>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Click to view - Make the whole card clickable */}
        <button
          onClick={() => router.push(`/protected/organizations/${organization.id}`)}
          className="absolute inset-0 rounded-2xl"
          aria-label={`View ${organization.name}`}
        />
      </motion.div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Organization?"
        description={`Are you sure you want to delete "${
          organization.name
        }"? This will permanently delete the organization${
          organization.member_count
            ? ` and remove ${organization.member_count} member${organization.member_count !== 1 ? "s" : ""}`
            : ""
        }. This action cannot be undone.`}
        actionLabel="Delete Organization"
        onAction={handleDelete}
        isDestructive
        isLoading={isDeleting}
      />

      <EditOrganizationModal
        organization={organization}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
}
