"use client";

import { motion } from "framer-motion";
import { Activity, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

interface OverviewStatsProps {
  data: {
    totalActiveCards: number;
    overdueCards: number;
    cardsCreatedThisMonth: number;
    completionRate: number;
    completedThisMonth: number;
  };
}

export function OverviewStats({ data }: OverviewStatsProps) {
  const stats = [
    {
      title: "Active Cards",
      value: data.totalActiveCards,
      icon: Activity,
      gradient: "from-blue-500 to-blue-600",
      description: "Cards assigned to you",
    },
    {
      title: "Overdue",
      value: data.overdueCards,
      icon: AlertCircle,
      gradient: "from-red-500 to-red-600",
      description: "Past due date",
    },
    {
      title: "Created This Month",
      value: data.cardsCreatedThisMonth,
      icon: TrendingUp,
      gradient: "from-purple-500 to-purple-600",
      description: "New cards",
    },
    {
      title: "Completion Rate",
      value: `${data.completionRate}%`,
      icon: CheckCircle2,
      gradient: "from-green-500 to-green-600",
      description: `${data.completedThisMonth} completed`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <div
            className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.gradient} p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl`}
          >
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10 transition-transform group-hover:scale-150" />

            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between">
                <stat.icon className="h-8 w-8 text-white/80" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                  className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white"
                >
                  Live
                </motion.div>
              </div>

              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                className="mb-2 text-4xl font-bold text-white"
              >
                {stat.value}
              </motion.div>

              <div className="text-sm font-medium text-white/90">{stat.title}</div>
              <div className="mt-1 text-xs text-white/70">{stat.description}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
