"use client";

import { motion } from "framer-motion";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TrendChartProps {
  data: Array<{
    date: string;
    created: number;
    completed: number;
  }>;
}

export function TrendChart({ data }: TrendChartProps) {
  // Calculate trends
  const recentData = data.slice(-7);
  const olderData = data.slice(-14, -7);

  const recentCreated = recentData.reduce((sum, d) => sum + d.created, 0);
  const olderCreated = olderData.reduce((sum, d) => sum + d.created, 0);
  const createdTrend = olderCreated > 0 ? ((recentCreated - olderCreated) / olderCreated) * 100 : 0;

  const recentCompleted = recentData.reduce((sum, d) => sum + d.completed, 0);
  const olderCompleted = olderData.reduce((sum, d) => sum + d.completed, 0);
  const completedTrend = olderCompleted > 0 ? ((recentCompleted - olderCompleted) / olderCompleted) * 100 : 0;

  // Format data for display
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="p-6">
        <div className="mb-6 flex flex-col lg:flex-row gap-2 items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Activity Trends</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cards created vs completed over the last 30 days</p>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Created</span>
              <div
                className={`ml-1 flex items-center text-xs ${createdTrend >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {createdTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(Math.round(createdTrend))}%
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</span>
              <div
                className={`ml-1 flex items-center text-xs ${completedTrend >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {completedTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(Math.round(completedTrend))}%
              </div>
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-xs text-gray-600 dark:text-gray-400"
                tick={{ fill: "currentColor" }}
              />
              <YAxis className="text-xs text-gray-600 dark:text-gray-400" tick={{ fill: "currentColor" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                labelStyle={{ color: "#1f2937", fontWeight: "bold" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="created"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
                name="Created"
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", r: 4 }}
                activeDot={{ r: 6 }}
                name="Completed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
