"use client";

import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Board } from "@/lib/types/organization";

interface BoardCardProps {
  board: Board;
  orgId: string;
  index: number;
}

export function BoardCard({ board, orgId, index }: BoardCardProps) {
  const formattedDate = new Date(board.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <Link href={`/protected/organizations/${orgId}/board/${board.id}`}>
        <div className="relative h-full overflow-hidden rounded-xl shadow-lg transition-shadow hover:shadow-2xl">
          {/* Background with gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: board.background_color,
              backgroundImage: `linear-gradient(135deg, ${board.background_color} 0%, ${adjustBrightness(
                board.background_color,
                -20
              )} 100%)`,
            }}
          />

          {/* Overlay for better text contrast */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />

          {/* Content */}
          <div className="relative p-6 h-40 flex flex-col justify-between text-white">
            {/* Title and Description */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold line-clamp-2 group-hover:text-white/90 transition-colors">
                {board.name}
              </h3>
              {board.description && <p className="text-sm text-white/80 line-clamp-2">{board.description}</p>}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Calendar className="w-3 h-3" />
                <span>{formattedDate}</span>
              </div>

              <motion.div className="flex items-center gap-1 text-sm font-medium" whileHover={{ x: 5 }}>
                <span>Open</span>
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </div>
          </div>

          {/* Animated border on hover */}
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-white/0 group-hover:border-white/30"
            transition={{ duration: 0.2 }}
          />
        </div>
      </Link>
    </motion.div>
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
