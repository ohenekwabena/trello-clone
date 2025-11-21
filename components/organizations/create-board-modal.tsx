"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, FileText } from "lucide-react";
import { createBoard } from "@/lib/actions/boards";
import type { CreateBoardInput } from "@/lib/types/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateBoardModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
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

export function CreateBoardModal({ orgId, isOpen, onClose }: CreateBoardModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_COLORS[0].value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Board name is required");
      return;
    }

    setIsLoading(true);

    const input: CreateBoardInput = {
      org_id: orgId,
      name: name.trim(),
      description: description.trim() || undefined,
      background_color: backgroundColor,
    };

    const result = await createBoard(input);

    if (result.success) {
      setName("");
      setDescription("");
      setBackgroundColor(BACKGROUND_COLORS[0].value);
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setError(result.error || "Failed to create board");
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    if (!isLoading) {
      setName("");
      setDescription("");
      setBackgroundColor(BACKGROUND_COLORS[0].value);
      setError(null);
      onClose();
    }
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Create New Board</h2>
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Board Name */}
                <div className="space-y-2">
                  <Label htmlFor="board-name" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Board Name
                  </Label>
                  <Input
                    id="board-name"
                    type="text"
                    placeholder="e.g., Project Roadmap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    required
                    maxLength={100}
                    className="w-full"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="board-description">Description (Optional)</Label>
                  <textarea
                    id="board-description"
                    placeholder="What's this board about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
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
                        onClick={() => setBackgroundColor(color.value)}
                        disabled={isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`h-12 rounded-lg transition-all ${
                          backgroundColor === color.value
                            ? "ring-4 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900"
                            : "ring-2 ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !name.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Creating...
                      </span>
                    ) : (
                      "Create Board"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
