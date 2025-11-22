"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Calendar, Users, Edit, Trash2, ArrowLeft, UserPlus, Mail, LayoutGrid, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteOrganization } from "@/lib/actions/organizations";
import { getOrganizationBoards } from "@/lib/actions/boards";
import { EditOrganizationModal } from "@/components/organizations/edit-organization-modal";
import { InviteMembersModal } from "@/components/organizations/invite-members-modal";
import { PendingInvitesList } from "@/components/organizations/pending-invites-list";
import { MembersList } from "@/components/organizations/members-list";
import { CreateBoardModal } from "@/components/organizations/create-board-modal";
import { BoardCard } from "@/components/organizations/board-card";
import { AlertDialog } from "@/components/ui/alert-dialog";
import type { OrganizationWithRole, Board } from "@/lib/types/organization";
import { cn } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";

interface OrganizationDetailClientProps {
  organization: OrganizationWithRole;
}

export function OrganizationDetailClient({ organization }: OrganizationDetailClientProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);
  const [invitesKey, setInvitesKey] = useState(0);

  // Fetch boards
  useEffect(() => {
    async function fetchBoards() {
      setIsLoadingBoards(true);
      const result = await getOrganizationBoards(organization.id);
      if (result.success && result.data) {
        setBoards(result.data);
      }
      setIsLoadingBoards(false);
    }
    fetchBoards();
  }, [organization.id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteOrganization(organization.id);
      if (result.success) {
        setShowDeleteConfirm(false);
        toast.success("Organization deleted successfully");
        router.push("/protected/organizations");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete organization");
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const isOwner = organization.role === "owner";
  const canInvite = organization.role === "owner" || organization.role === "admin";

  const handleInviteSuccess = () => {
    // Force refresh of invites list by changing key
    setInvitesKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-5xl">
      {/* Back Button */}
      <Link
        href="/protected/organizations"
        className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-4 sm:mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back to Organizations</span>
        <span className="sm:hidden">Back</span>
      </Link>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-8 mb-4 sm:mb-6"
      >
        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex items-start gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xl sm:text-2xl font-bold text-white flex-shrink-0">
              {organization.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 text-wrap">
                {organization.name}
              </h1>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-medium rounded-full",
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
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
                disabled={isDeleting}
                className="flex-1 sm:flex-initial"
              >
                <Edit className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex-1 sm:flex-initial"
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          )}
        </div>

        {organization.description && (
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4 sm:mb-6 line-clamp-3">
            {organization.description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 pt-4 sm:pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Members</div>
              <div className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {organization.member_count || 0}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Created</div>
              <div className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {formatDate(organization.created_at)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">Status</div>
              <div className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">Active</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Boards Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-8 mb-4 sm:mb-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-600 dark:text-neutral-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Boards</h2>
          </div>
          <Button
            onClick={() => setIsCreateBoardModalOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-full sm:w-auto"
            size="sm"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Create Board</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>

        {isLoadingBoards ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 sm:h-40 bg-neutral-100 dark:bg-neutral-800 rounded-lg sm:rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : boards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {boards.map((board, index) => (
              <BoardCard key={board.id} board={board} orgId={organization.id} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <LayoutGrid className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              No boards yet
            </h3>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4 sm:mb-6">
              Create your first board to get started!
            </p>
            <Button
              onClick={() => setIsCreateBoardModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              size="sm"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Create Board</span>
              <span className="sm:hidden">Create</span>
            </Button>
          </div>
        )}
      </motion.div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Members Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600 dark:text-neutral-400" />
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">Members</h2>
              </div>
              {canInvite && (
                <Button
                  size="sm"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                >
                  <UserPlus className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Invite</span>
                </Button>
              )}
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <MembersList organizationId={organization.id} />
          </div>
        </motion.div>

        {/* Invites Section */}
        {canInvite && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
          >
            <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600 dark:text-neutral-400" />
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">Pending Invites</h2>
              </div>
            </div>
            <PendingInvitesList key={invitesKey} organizationId={organization.id} />
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
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

      {/* Edit Modal */}
      <EditOrganizationModal
        organization={organization}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Invite Modal */}
      <InviteMembersModal
        organizationId={organization.id}
        organizationName={organization.name}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={handleInviteSuccess}
      />

      {/* Create Board Modal */}
      <CreateBoardModal
        orgId={organization.id}
        isOpen={isCreateBoardModalOpen}
        onClose={() => {
          setIsCreateBoardModalOpen(false);
          // Refresh boards after creating
          getOrganizationBoards(organization.id).then((result) => {
            if (result.success && result.data) {
              setBoards(result.data);
            }
          });
        }}
      />
    </div>
  );
}
