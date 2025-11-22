"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Building2, Car, GraduationCap, MoreVertical } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  description: string;
  board: string;
  date: string;
}

interface TransactionsListProps {
  transactions: Transaction[];
  activityCount: number;
  className?: string;
}

const iconMap = {
  created_card: Building2,
  moved_card: Car,
  assigned_card: GraduationCap,
  commented: Building2,
  other: Building2,
};

const colorMap: Record<string, string> = {
  created_card: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  moved_card: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  assigned_card: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  commented: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  other: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
};

export function TransactionsList({ transactions, activityCount, className = "" }: TransactionsListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="bg-white dark:bg-gray-800 border-none p-6 h-full flex flex-col">
        {/* Activity Summary Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative bg-gradient-to-br from-[#4318ff] to-[#6b46ff] rounded-2xl p-5 mb-6 overflow-hidden shadow-lg"
        >
          <div className="relative z-10">
            <p className="text-xs font-medium text-white/70 mb-1">Monthly Activities</p>
            <p className="text-3xl font-bold text-white mb-3">{activityCount}</p>

            <button className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Mini trend indicator */}
            <div className="absolute bottom-3 right-3 w-16 h-6">
              <svg className="w-full h-full" viewBox="0 0 60 20" preserveAspectRatio="none">
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  d="M 0,15 Q 15,10 30,12 T 60,8"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.5"
                />
              </svg>
            </div>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10" />
        </motion.div>

        {/* Recent label */}
        <p className="text-xs font-medium text-[#a3aed0] dark:text-gray-400 mb-4">Recent Activities</p>

        {/* Transactions list */}
        <div className="space-y-4 flex-1">
          {transactions.map((transaction, index) => {
            const Icon = iconMap[transaction.type as keyof typeof iconMap] || Building2;
            const colorClass = colorMap[transaction.type] || colorMap.other;

            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-bold text-[#1b2559] dark:text-white">{transaction.description}</p>
                  <p className="text-xs font-medium text-[#a3aed0] dark:text-gray-400">{transaction.board}</p>
                </div>

                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  className="text-xs font-medium text-[#a3aed0] dark:text-gray-400"
                >
                  {transaction.date}
                </motion.p>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
