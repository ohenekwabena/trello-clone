"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import type { CardWithDetails } from "@/lib/types/organization";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getAvatarColor, getDisplayName } from "@/lib/utils/user-helpers";

interface DraggableCardProps {
  card: CardWithDetails;
  onClick: () => void;
}

export function DraggableCard({ card, onClick }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: {
      type: "card",
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    scale: isDragging ? 1.05 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-white/20 backdrop-blur-sm rounded-lg p-3 border transition-all cursor-pointer ${
        isDragging ? "border-blue-400 shadow-lg shadow-blue-500/50" : "border-white/30 hover:border-white/50"
      }`}
    >
      <h4 className="text-white font-medium mb-1">{card.title}</h4>

      {card.description && <p className="text-white/70 text-sm mb-2 line-clamp-2">{card.description}</p>}

      <div className="flex flex-wrap gap-2 items-center">
        {card.due_date && (
          <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(card.due_date).toLocaleDateString()}
          </Badge>
        )}

        {card.assigned_profile && (
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 border border-white/30">
            <Avatar className="w-5 h-5">
              {card.assigned_profile.avatar_url ? (
                <AvatarImage src={card.assigned_profile.avatar_url} alt={getDisplayName(card.assigned_profile)} />
              ) : null}
              <AvatarFallback className={`${getAvatarColor(card.assigned_profile)} text-white text-xs font-medium`}>
                {getInitials(card.assigned_profile)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-white font-medium">{getDisplayName(card.assigned_profile)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
