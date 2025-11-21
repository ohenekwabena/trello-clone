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
        router.push("/protected/organizations");
        router.refresh();
      } else {
        alert(result.error || "Failed to delete organization");
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
      alert("An unexpected error occurred");
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back Button */}
      <Link
        href="/protected/organizations"
        className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Organizations
      </Link>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 mb-6"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white">
              {organization.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">{organization.name}</h1>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded-full",
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(true)} disabled={isDeleting}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {organization.description && (
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">{organization.description}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Users className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">Members</div>
              <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {organization.member_count || 0}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">Created</div>
              <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {formatDate(organization.created_at)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">Status</div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">Active</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Boards Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Boards</h2>
          </div>
          <Button
            onClick={() => setIsCreateBoardModalOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Board
          </Button>
        </div>

        {isLoadingBoards ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : boards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board, index) => (
              <BoardCard key={board.id} board={board} orgId={organization.id} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <LayoutGrid className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">No boards yet</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">Create your first board to get started!</p>
            <Button
              onClick={() => setIsCreateBoardModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Board
            </Button>
          </div>
        )}
      </motion.div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        >
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Members</h2>
              </div>
              {canInvite && (
                <Button
                  size="sm"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Invite
                </Button>
              )}
            </div>
          </div>
          <div className="p-6">
            <MembersList organizationId={organization.id} />
          </div>
        </motion.div>

        {/* Invites Section */}
        {canInvite && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Pending Invites</h2>
              </div>
            </div>
            <PendingInvitesList organizationId={organization.id} />
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
