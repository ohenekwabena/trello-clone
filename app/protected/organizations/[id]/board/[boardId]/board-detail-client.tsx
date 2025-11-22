"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Settings, Trash2, Edit, X, Palette, FileText, LayoutGrid, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { ListSkeleton } from "@/components/ui/loading-skeletons";
import { updateBoard, deleteBoard } from "@/lib/actions/boards";
import { BoardList as DraggableList, AddListButton } from "@/components/boards/draggable-list";
import { DraggableCard } from "@/components/boards/draggable-card";
import { CardDetailModal } from "@/components/boards";
import type { Board, OrganizationRole, CardWithDetails } from "@/lib/types/organization";
import toast from "react-hot-toast";
import { useOptimisticBoard } from "@/lib/hooks/use-optimistic-board";

interface BoardDetailClientProps {
  board: Board;
  role: OrganizationRole;
}

const BACKGROUND_COLORS = [
  { name: "Blue", value: "#0079BF" },
  { name: "Green", value: "#519839" },
  { name: "Orange", value: "#D29034" },
  { name: "Red", value: "#B04632" },
  { name: "Purple", value: "#89609E" },
  { name: "Pink", value: "#CD5A91" },
  { name: "Lime", value: "#4BBF6B" },
  { name: "Sky", value: "#00AECC" },
  { name: "Grey", value: "#838C91" },
];

export function BoardDetailClient({ board, role }: BoardDetailClientProps) {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Remove local lists and cards state - use only from hook
  const [selectedCard, setSelectedCard] = useState<CardWithDetails | null>(null);

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"list" | "card" | null>(null);

  // Edit form state
  const [editName, setEditName] = useState(board.name);
  const [editDescription, setEditDescription] = useState(board.description || "");
  const [editBackgroundColor, setEditBackgroundColor] = useState(board.background_color);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canEdit = role === "owner" || role === "admin";

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Use optimistic board hook
  const {
    lists,
    cards,
    isLoading: isLoadingData,
    loadBoardData,
    optimisticReorderLists,
    updateListWithOptimism,
    moveCardWithOptimism,
    createCardWithOptimism,
    deleteListWithOptimism,
    createListWithOptimism,
    optimisticMoveCard,
  } = useOptimisticBoard(board.id);

  // Load lists and cards
  useEffect(() => {
    loadBoardData();
  }, [board.id, loadBoardData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close modals
      if (e.key === "Escape") {
        if (selectedCard) {
          setSelectedCard(null);
        } else if (isSettingsOpen && !isEditing) {
          setIsSettingsOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCard, isSettingsOpen, isEditing]);

  // Organize cards by list
  const getCardsForList = (listId: string): CardWithDetails[] => {
    return cards.filter((card) => card.list_id === listId).sort((a, b) => a.position - b.position);
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveType(active.data.current?.type || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Handle card over card or card over list
    if (activeType === "card") {
      const activeCard = cards.find((c) => c.id === active.id);
      if (!activeCard) return;

      let targetListId: string | null = null;

      if (overType === "card") {
        const overCard = cards.find((c) => c.id === over.id);
        targetListId = overCard?.list_id || null;
      } else if (overType === "list" || over.id.toString().startsWith("list-")) {
        targetListId = over.data.current?.listId || over.id.toString().replace("list-", "");
      }

      if (targetListId && activeCard.list_id !== targetListId) {
        // Use optimistic update from hook
        optimisticMoveCard(active.id as string, targetListId, activeCard.position);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;

    if (activeType === "list") {
      const oldIndex = lists.findIndex((list) => list.id === active.id);
      const newIndex = lists.findIndex((list) => list.id === over.id);

      if (oldIndex !== newIndex) {
        const newLists = arrayMove(lists, oldIndex, newIndex);
        optimisticReorderLists(newLists);

        const movedList = newLists[newIndex];
        let newPosition: number;

        if (newIndex === 0) {
          newPosition = newLists[1] ? newLists[1].position / 2 : 1000;
        } else if (newIndex === newLists.length - 1) {
          newPosition = newLists[newIndex - 1].position + 1000;
        } else {
          newPosition = (newLists[newIndex - 1].position + newLists[newIndex + 1].position) / 2;
        }

        try {
          await updateListWithOptimism(movedList.id, { position: newPosition });
          toast.success("List reordered");
        } catch (error) {
          toast.error("Failed to reorder list");
        }
      }
    } else if (activeType === "card") {
      const activeCard = cards.find((c) => c.id === active.id);
      if (!activeCard) return;

      const overType = over.data.current?.type;
      let targetListId: string;
      let overCardId: string | null = null;

      if (overType === "card") {
        const overCard = cards.find((c) => c.id === over.id);
        if (!overCard) return;
        targetListId = overCard.list_id;
        overCardId = overCard.id;
      } else if (overType === "list" || over.id.toString().startsWith("list-")) {
        targetListId = over.data.current?.listId || over.id.toString().replace("list-", "");
      } else {
        return;
      }

      const targetListCards = cards
        .filter((c) => c.list_id === targetListId && c.id !== active.id)
        .sort((a, b) => a.position - b.position);

      let newPosition: number;

      if (overCardId) {
        const overIndex = targetListCards.findIndex((c) => c.id === overCardId);

        if (overIndex === -1) {
          newPosition = targetListCards.length > 0 ? targetListCards[targetListCards.length - 1].position + 1000 : 1000;
        } else if (overIndex === 0) {
          newPosition = targetListCards[0].position / 2;
        } else {
          newPosition = (targetListCards[overIndex - 1].position + targetListCards[overIndex].position) / 2;
        }
      } else {
        newPosition = targetListCards.length > 0 ? targetListCards[targetListCards.length - 1].position + 1000 : 1000;
      }

      try {
        await moveCardWithOptimism(activeCard.id, targetListId, newPosition);
        toast.success("Card moved");
      } catch (error) {
        toast.error("Failed to move card");
      }
    }
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);

    if (!editName.trim()) {
      setSaveError("Board name is required");
      return;
    }

    setIsSaving(true);

    const result = await updateBoard(board.id, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      background_color: editBackgroundColor,
    });

    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => {
        setIsEditing(false);
        router.refresh();
      }, 1000);
    } else {
      setSaveError(result.error || "Failed to update board");
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteBoard(board.id);

    if (result.success) {
      toast.success("Board deleted successfully");
      router.push(`/protected/organizations/${board.org_id}`);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete board. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="min-h-screen my-8 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: board.background_color,
        backgroundImage: `linear-gradient(135deg, ${board.background_color} 0%, ${adjustBrightness(
          board.background_color,
          -20
        )} 100%)`,
      }}
    >
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-2 sm:px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href={`/protected/organizations/${board.org_id}`}
                className="text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-white">{board.name}</h1>
            </div>

            {canEdit && (
              <Button
                onClick={() => setIsSettingsOpen(true)}
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Settings className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            )}
          </div>

          {board.description && (
            <p className="text-white/80 text-sm sm:text-base mt-2 ml-7 sm:ml-10">{board.description}</p>
          )}
        </div>
      </div>

      {/* Board Content - Lists and Cards */}
      <div className="px-2 sm:px-4 py-6 overflow-x-auto">
        {isLoadingData ? (
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <ListSkeleton key={i} />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 pb-4">
              <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
                {lists.map((list) => (
                  <div key={list.id}>
                    <DraggableList
                      list={list}
                      cards={getCardsForList(list.id)}
                      boardId={board.id}
                      onCardClick={setSelectedCard}
                      onRefresh={loadBoardData}
                      updateListWithOptimism={updateListWithOptimism}
                      deleteListWithOptimism={deleteListWithOptimism}
                      createCardWithOptimism={createCardWithOptimism}
                    />
                  </div>
                ))}
              </SortableContext>
              <AddListButton
                boardId={board.id}
                onRefresh={loadBoardData}
                createListWithOptimism={createListWithOptimism}
              />
            </div>

            <DragOverlay>
              {activeId && activeType === "card" && (
                <div className="opacity-80">
                  {(() => {
                    const card = cards.find((c) => c.id === activeId);
                    return card ? <DraggableCard card={card} onClick={() => {}} /> : null;
                  })()}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {lists.length === 0 && !isLoadingData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-12 text-white text-center max-w-2xl mx-auto"
          >
            <LayoutGrid className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Start organizing your work</h2>
            <p className="text-white/80 mb-6">Create your first list to add cards and track tasks.</p>
            <Button
              onClick={() => {
                const btn = document.querySelector("[data-add-list-trigger]") as HTMLButtonElement;
                btn?.click();
              }}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Create your first list
            </Button>
          </motion.div>
        )}
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          onRefresh={loadBoardData}
        />
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isEditing && setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Board Settings</h2>
                    <button
                      onClick={() => {
                        if (!isEditing) {
                          setIsSettingsOpen(false);
                        }
                      }}
                      disabled={isEditing}
                      className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {!isEditing ? (
                    <>
                      {/* View Mode */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Board Name</h3>
                          <p className="text-lg font-semibold">{board.name}</p>
                        </div>

                        {board.description && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</h3>
                            <p className="text-gray-700 dark:text-gray-300">{board.description}</p>
                          </div>
                        )}

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Background Color
                          </h3>
                          <div className="w-full h-20 rounded-lg" style={{ backgroundColor: board.background_color }} />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        <Button onClick={() => setIsEditing(true)} className="flex-1 bg-blue-500 hover:bg-blue-600">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Board
                        </Button>
                        <Button
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={isDeleting}
                          variant="outline"
                          className="flex-1 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Board
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Edit Mode */}
                      <div className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                          <Label htmlFor="edit-name" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Board Name
                          </Label>
                          <Input
                            id="edit-name"
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            disabled={isSaving}
                            required
                            maxLength={100}
                          />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <Label htmlFor="edit-description">Description (Optional)</Label>
                          <textarea
                            id="edit-description"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            disabled={isSaving}
                            maxLength={500}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 resize-none"
                          />
                        </div>

                        {/* Background Color */}
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            Background Color
                          </Label>
                          <div className="grid grid-cols-5 gap-2">
                            {BACKGROUND_COLORS.map((color) => (
                              <motion.button
                                key={color.value}
                                type="button"
                                onClick={() => setEditBackgroundColor(color.value)}
                                disabled={isSaving}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`h-12 rounded-lg transition-all ${
                                  editBackgroundColor === color.value
                                    ? "ring-4 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900"
                                    : "ring-2 ring-transparent hover:ring-gray-300"
                                }`}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <AnimatePresence>
                        {saveError && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
                          >
                            {saveError}
                          </motion.div>
                        )}
                        {saveSuccess && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Board updated successfully!
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setEditName(board.name);
                            setEditDescription(board.description || "");
                            setEditBackgroundColor(board.background_color);
                            setSaveError(null);
                            setSaveSuccess(false);
                          }}
                          disabled={isSaving}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={isSaving || !editName.trim()}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        >
                          {isSaving ? (
                            <span className="flex items-center gap-2">
                              <motion.div
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              />
                              Saving...
                            </span>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Board Confirmation */}
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Board?"
        description={`Are you sure you want to delete "${board.name}"? This will permanently delete all ${
          lists.length
        } list${lists.length !== 1 ? "s" : ""} and ${cards.length} card${
          cards.length !== 1 ? "s" : ""
        }. This action cannot be undone.`}
        actionLabel="Delete Board"
        onAction={handleDelete}
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
}

// Helper function to adjust color brightness
function adjustBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return `#${((R << 16) | (G << 8) | B).toString(16).padStart(6, "0")}`;
}
