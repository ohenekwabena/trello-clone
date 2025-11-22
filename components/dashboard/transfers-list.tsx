"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";

interface Transfer {
  id: string;
  type: string;
  cardTitle: string;
  userName: string;
  userAvatar?: string;
  date: string;
}

interface TransfersListProps {
  transfers: Transfer[];
  className?: string;
}

export function TransfersList({ transfers, className = "" }: TransfersListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="bg-white dark:bg-gray-800 border-none p-6 h-full flex flex-col">
        <h3 className="text-xl font-bold text-[#1b2559] dark:text-white mb-6">Card Assignments</h3>

        <div className="space-y-4 flex-1">
          {transfers.length === 0 ? (
            <p className="text-sm text-[#a3aed0] dark:text-gray-400 text-center py-8">No recent card assignments</p>
          ) : (
            transfers.map((transfer, index) => (
              <motion.div
                key={transfer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage src={transfer.userAvatar} alt={transfer.userName} />
                  <AvatarFallback className="bg-[#4318ff] text-white text-sm">
                    {transfer.userName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <p className="text-sm font-bold text-[#1b2559] dark:text-white">{transfer.cardTitle}</p>
                  <p className="text-xs font-medium text-[#a3aed0] dark:text-gray-400">
                    {transfer.type === "assignment" ? "Assigned by" : "From"} {transfer.userName}
                  </p>
                </div>

                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                  className="text-xs font-medium text-[#a3aed0] dark:text-gray-400"
                >
                  {transfer.date}
                </motion.p>
              </motion.div>
            ))
          )}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="flex items-center justify-end gap-2 text-sm font-bold text-[#4318ff] hover:gap-3 transition-all mt-4"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </Card>
    </motion.div>
  );
}
