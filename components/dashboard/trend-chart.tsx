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
      <Card className="p-4 sm:p-6">
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Activity Trends</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              Cards created vs completed over the last 30 days
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">
                <span className="hidden sm:inline">Created</span>
                <span className="sm:hidden">Crtd</span>
              </span>
              <div
                className={`ml-1 flex items-center gap-0.5 text-xs flex-shrink-0 ${
                  createdTrend >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {createdTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span className="hidden xs:inline">{Math.abs(Math.round(createdTrend))}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">
                <span className="hidden sm:inline">Completed</span>
                <span className="sm:hidden">Cmpl</span>
              </span>
              <div
                className={`ml-1 flex items-center gap-0.5 text-xs flex-shrink-0 ${
                  completedTrend >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {completedTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span className="hidden xs:inline">{Math.abs(Math.round(completedTrend))}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-80 w-full overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400"
                tick={{ fill: "currentColor" }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400"
                tick={{ fill: "currentColor" }}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#1f2937", fontWeight: "bold" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} iconSize={12} />
              <Line
                type="monotone"
                dataKey="created"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 3 }}
                activeDot={{ r: 5 }}
                name="Created"
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 3 }}
                activeDot={{ r: 5 }}
                name="Completed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
