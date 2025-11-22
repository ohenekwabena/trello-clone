"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, GripVertical, Trash2, Edit2 } from "lucide-react";
import { createList, updateList, deleteList, getNextListPosition } from "@/lib/actions/lists";
import { createCard, getNextCardPosition } from "@/lib/actions/cards";
import type { List, Card } from "@/lib/types/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardItem } from "./card-item";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface BoardListProps {
  list: List;
  cards: Card[];
  boardId: string;
  onCardClick: (card: Card) => void;
  onRefresh: () => void;
}

export function BoardList({ list, cards, boardId, onCardClick, onRefresh }: BoardListProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;

    setIsLoading(true);
    const position = await getNextCardPosition(list.id);
    const result = await createCard({
      board_id: boardId,
      list_id: list.id,
      title: newCardTitle.trim(),
      position,
    });

    if (result.success) {
      setNewCardTitle("");
      setIsAddingCard(false);
      onRefresh();
    }
    setIsLoading(false);
  };

  const handleUpdateTitle = async () => {
    if (!editTitle.trim() || editTitle === list.title) {
      setIsEditingTitle(false);
      setEditTitle(list.title);
      return;
    }

    setIsLoading(true);
    const result = await updateList(list.id, { title: editTitle.trim() });
    if (result.success) {
      setIsEditingTitle(false);
      onRefresh();
    }
    setIsLoading(false);
  };

  const handleDeleteList = async () => {
    setIsLoading(true);
    const result = await deleteList(list.id);
    if (result.success) {
      setShowDeleteConfirm(false);
      onRefresh();
    }
    setIsLoading(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-shrink-0 w-80"
      >
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-3 h-full flex flex-col">
          {/* List Header */}
          <div className="flex items-center gap-2 mb-3">
            <GripVertical className="w-4 h-4 text-white/60 cursor-grab active:cursor-grabbing flex-shrink-0" />

            {isEditingTitle ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleUpdateTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateTitle();
                  if (e.key === "Escape") {
                    setIsEditingTitle(false);
                    setEditTitle(list.title);
                  }
                }}
                autoFocus
                disabled={isLoading}
                className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/50 h-8"
              />
            ) : (
              <h3
                onClick={() => setIsEditingTitle(true)}
                className="flex-1 font-semibold text-white cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors"
              >
                {list.title}
              </h3>
            )}

            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-white/60 hover:text-white transition-colors p-1"
              title="Edit list title"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLoading}
              className="text-white/60 hover:text-red-400 transition-colors p-1 disabled:opacity-50"
              title="Delete list"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Cards */}
          <div className="flex-1 space-y-2 overflow-y-auto min-h-0 mb-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <AnimatePresence mode="popLayout">
              {cards.map((card, index) => (
                <CardItem key={card.id} card={card} index={index} onClick={() => onCardClick(card)} />
              ))}
            </AnimatePresence>
          </div>

          {/* Add Card */}
          <div>
            {isAddingCard ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <textarea
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddCard();
                    }
                    if (e.key === "Escape") {
                      setIsAddingCard(false);
                      setNewCardTitle("");
                    }
                  }}
                  placeholder="Enter card title..."
                  autoFocus
                  disabled={isLoading}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddCard}
                    disabled={isLoading || !newCardTitle.trim()}
                    size="sm"
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    {isLoading ? "Adding..." : "Add Card"}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingCard(false);
                      setNewCardTitle("");
                    }}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-white/30 text-white hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <Button
                onClick={() => setIsAddingCard(true)}
                variant="ghost"
                size="sm"
                className="w-full text-white/80 hover:text-white hover:bg-white/10 justify-start"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add a card
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete List?"
        description={`Are you sure you want to delete "${list.title}"? This will permanently delete ${
          cards.length
        } card${cards.length !== 1 ? "s" : ""} and cannot be undone.`}
        actionLabel="Delete List"
        onAction={handleDeleteList}
        isDestructive
        isLoading={isLoading}
      />
    </>
  );
}

export function AddListButton({ boardId, onRefresh }: { boardId: string; onRefresh: () => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddList = async () => {
    if (!title.trim()) return;

    setIsLoading(true);
    const position = await getNextListPosition(boardId);
    const result = await createList({
      board_id: boardId,
      title: title.trim(),
      position,
    });

    if (result.success) {
      setTitle("");
      setIsAdding(false);
      onRefresh();
    }
    setIsLoading(false);
  };

  if (!isAdding) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-shrink-0 w-80"
      >
        <Button
          onClick={() => setIsAdding(true)}
          variant="ghost"
          className="w-full h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white justify-start"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add a list
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-shrink-0 w-80">
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddList();
            if (e.key === "Escape") {
              setIsAdding(false);
              setTitle("");
            }
          }}
          placeholder="Enter list title..."
          autoFocus
          disabled={isLoading}
          className="mb-2 bg-white/20 border-white/30 text-white placeholder:text-white/50"
        />
        <div className="flex gap-2">
          <Button
            onClick={handleAddList}
            disabled={isLoading || !title.trim()}
            size="sm"
            className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            {isLoading ? "Adding..." : "Add List"}
          </Button>
          <Button
            onClick={() => {
              setIsAdding(false);
              setTitle("");
            }}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="bg-transparent border-white/30 text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
