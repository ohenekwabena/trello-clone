"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, User, AlignLeft, Trash2, Save, Clock, Activity, Tag } from "lucide-react";
import { updateCard, deleteCard, getCardActivities } from "@/lib/actions/cards";
import type { Card, CardActivityWithActor } from "@/lib/types/organization";
import { getDisplayName, getInitials, getAvatarColor } from "@/lib/utils/user-helpers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CardDetailModalProps {
  card: Card;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function CardDetailModal({ card, isOpen, onClose, onRefresh }: CardDetailModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [dueDate, setDueDate] = useState(card.due_date ? new Date(card.due_date).toISOString().split("T")[0] : "");
  const [isLoading, setIsLoading] = useState(false);
  const [activities, setActivities] = useState<CardActivityWithActor[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadActivities();
    }
  }, [isOpen, card.id]);

  useEffect(() => {
    const changed =
      title !== card.title ||
      description !== (card.description || "") ||
      dueDate !== (card.due_date ? new Date(card.due_date).toISOString().split("T")[0] : "");
    setHasChanges(changed);
  }, [title, description, dueDate, card]);

  const loadActivities = async () => {
    setLoadingActivities(true);
    const result = await getCardActivities(card.id);
    console.log("Card Activities Result:", result);
    if (result.success && result.data) {
      setActivities(result.data);
    }
    setLoadingActivities(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    const result = await updateCard(card.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDate || null,
    });

    if (result.success) {
      setHasChanges(false);
      onRefresh();
      loadActivities(); // Reload activities after update
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this card? This action cannot be undone.")) return;

    setIsLoading(true);
    const result = await deleteCard(card.id);
    if (result.success) {
      onClose();
      onRefresh();
    }
    setIsLoading(false);
  };

  const formatActivityMessage = (activity: CardActivityWithActor): string => {
    const actorName = getDisplayName(activity.actor_profile);

    switch (activity.activity_type) {
      case "card_created":
        return `created this card`;
      case "card_updated":
        if (activity.payload.title_changed) {
          return `changed title from "${activity.payload.old_title}" to "${activity.payload.new_title}"`;
        }
        if (activity.payload.description_changed) {
          return `updated the description`;
        }
        return `updated this card`;
      case "card_moved":
        return `moved this card`;
      case "card_assigned":
        return `assigned this card`;
      case "card_unassigned":
        return `removed assignment`;
      case "card_due_date_set":
        return `set due date to ${new Date(activity.payload.due_date).toLocaleDateString()}`;
      case "card_due_date_changed":
        return `changed due date`;
      case "card_due_date_removed":
        return `removed due date`;
      default:
        return `performed an action`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isLoading}
                      className="text-xl font-bold bg-white/20 border-white/30 text-white placeholder:text-white/70 mb-2"
                    />
                    <p className="text-sm text-white/80">
                      in list • Created {new Date(card.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-3 gap-6 p-6">
                  {/* Main Content */}
                  <div className="col-span-2 space-y-6">
                    {/* Description */}
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <AlignLeft className="w-4 h-4" />
                        Description
                      </Label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isLoading}
                        placeholder="Add a more detailed description..."
                        rows={6}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 resize-none"
                      />
                    </div>

                    {/* Activity Feed */}
                    <div>
                      <Label className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4" />
                        Activity
                      </Label>

                      {loadingActivities ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                          ))}
                        </div>
                      ) : activities.length > 0 ? (
                        <div className="space-y-2">
                          {activities.map((activity) => (
                            <motion.div
                              key={activity.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarFallback
                                  className={`${getAvatarColor(activity.actor_profile)} text-white text-sm font-medium`}
                                >
                                  {getInitials(activity.actor_profile)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                  <span className="font-medium">{getDisplayName(activity.actor_profile)}</span>{" "}
                                  {formatActivityMessage(activity)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {formatTimestamp(activity.created_at)}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No activity yet</p>
                      )}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    {/* Due Date */}
                    <div>
                      <Label htmlFor="due-date" className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4" />
                        Due Date
                      </Label>
                      <Input
                        id="due-date"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        disabled={isLoading}
                        className="w-full"
                      />
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t space-y-2">
                      <Button
                        onClick={handleSave}
                        disabled={isLoading || !hasChanges}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isLoading ? "Saving..." : "Save Changes"}
                      </Button>

                      <Button
                        onClick={handleDelete}
                        disabled={isLoading}
                        variant="outline"
                        className="w-full text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Card
                      </Button>
                    </div>

                    {/* Metadata */}
                    <div className="pt-4 border-t space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>Created {new Date(card.created_at).toLocaleDateString()}</span>
                      </div>
                      {card.updated_at !== card.created_at && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>Updated {new Date(card.updated_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
