"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";
import Link from "next/link";

interface BoardActivityChartProps {
  data: Array<{
    id: string;
    name: string;
    activityCount: number;
    totalCards: number;
    completedCards: number;
    inProgressCards: number;
    backgroundColor?: string;
    orgId: string;
  }>;
}

const COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // green
  "#06b6d4", // cyan
];

export function BoardActivityChart({ data }: BoardActivityChartProps) {
  const chartData = data
    .sort((a, b) => b.activityCount - a.activityCount)
    .slice(0, 6)
    .map((board, index) => ({
      ...board,
      color: COLORS[index % COLORS.length],
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="p-6">
        <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Most Active Boards</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Activity in the last 30 days</p>
          </div>
          <Activity className="h-6 w-6 text-gray-400" />
        </div>

        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-gray-500 dark:text-gray-400">
            No board activity yet
          </div>
        ) : (
          <>
            <div className="h-80 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" className="text-xs" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    className="text-xs"
                    width={80}
                    tick={{ fill: "currentColor" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg bg-white p-3 shadow-lg dark:bg-gray-800">
                            <p className="font-semibold text-gray-900 dark:text-white">{data.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Activities: <span className="font-semibold">{data.activityCount}</span>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Total Cards: <span className="font-semibold">{data.totalCards}</span>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              In Progress: <span className="font-semibold">{data.inProgressCards}</span>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Completed: <span className="font-semibold">{data.completedCards}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="activityCount" radius={[0, 8, 8, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 border-t pt-4 dark:border-gray-700 md:grid-cols-2">
              {chartData.slice(0, 3).map((board) => (
                <Link
                  key={board.id}
                  href={`/protected/organizations/${board.orgId}/board/${board.id}`}
                  className="group flex flex-col items-start gap-3 rounded-lg border p-3 transition-all hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/20 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg"
                      style={{ backgroundColor: board.backgroundColor || board.color }}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{board.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{board.totalCards} cards</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{board.activityCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">activities</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
}
