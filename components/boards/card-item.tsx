"use client";

import { motion } from "framer-motion";
import { Calendar, User, MessageSquare, Paperclip } from "lucide-react";
import type { Card } from "@/lib/types/organization";

interface CardItemProps {
  card: Card;
  index: number;
  onClick: () => void;
}

export function CardItem({ card, index, onClick }: CardItemProps) {
  const hasDueDate = !!card.due_date;
  const isOverdue = hasDueDate && new Date(card.due_date!) < new Date();
  const hasAssignee = !!card.assigned_to;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        layout: { type: "spring", stiffness: 500, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700">
        {/* Card Title */}
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 break-words">{card.title}</h4>

        {/* Card Description Preview */}
        {card.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{card.description}</p>
        )}

        {/* Card Metadata */}
        {(hasDueDate || hasAssignee) && (
          <div className="flex items-center gap-2 flex-wrap">
            {hasDueDate && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  isOverdue
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(card.due_date!).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}

            {hasAssignee && (
              <div className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                <User className="w-3 h-3" />
                <span>Assigned</span>
              </div>
            )}
          </div>
        )}

        {/* Hover overlay with quick actions */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg pointer-events-none"
        />
      </div>
    </motion.div>
  );
}
