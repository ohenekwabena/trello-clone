"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Check, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BalanceChartProps {
  saves: number;
  savesChange: number;
  balance: number;
  balanceChange: number;
  onTrack: boolean;
  weeklyData: Array<{ week: string; completed: number; created: number }>;
  className?: string;
}

export function BalanceChart({
  saves,
  savesChange,
  balance,
  balanceChange,
  onTrack,
  weeklyData,
  className = "",
}: BalanceChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="bg-white dark:bg-gray-800 border-none p-6 h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-[#1b2559] dark:text-white">Activity Overview</h3>
            {onTrack && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex items-center gap-1"
              >
                <div className="w-4 h-4 rounded-full bg-[#05cd99] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-semibold text-[#05cd99]">On track</span>
              </motion.div>
            )}
          </div>

          <button className="flex items-center gap-1 text-sm font-semibold text-[#a3aed0] hover:text-[#4318ff] transition-colors">
            Monthly
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-md"
          >
            <p className="text-xs font-medium text-[#a3aed0] dark:text-gray-400 mb-2">Cards Assigned</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-[#1b2559] dark:text-white">{saves}</p>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              >
                {savesChange > 0 ? "+" : ""}
                {savesChange.toFixed(1)}%
              </Badge>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-md"
          >
            <p className="text-xs font-medium text-[#a3aed0] dark:text-gray-400 mb-2">Total Activities</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-[#1b2559] dark:text-white">{balance}</p>
              <Badge
                variant={balanceChange >= 0 ? "secondary" : "destructive"}
                className={
                  balanceChange >= 0
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                }
              >
                {balanceChange > 0 ? "+" : ""}
                {balanceChange.toFixed(1)}%
              </Badge>
            </div>
          </motion.div>
        </div>

        {/* Chart */}
        <div className="h-48 relative">
          <svg className="w-full h-full" viewBox="0 0 700 180" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1="0"
                y1={i * 45}
                x2="700"
                y2={i * 45}
                stroke="#e9edf7"
                strokeWidth="1"
                className="dark:stroke-gray-700"
              />
            ))}

            {/* Area chart */}
            <motion.path
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.2 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              d={generateAreaPath(weeklyData)}
              fill="url(#gradient)"
              stroke="none"
            />

            {/* Line chart */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              d={generateLinePath(weeklyData)}
              fill="none"
              stroke="#4318ff"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Data points */}
            {weeklyData.map((item, index) => {
              const x = (index / (weeklyData.length - 1)) * 700;
              const value = (item.completed / Math.max(...weeklyData.map((d) => d.completed))) * 150;
              const y = 180 - value - 15;

              return (
                <motion.circle
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#4318ff"
                  className="cursor-pointer hover:r-7 transition-all"
                />
              );
            })}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4318ff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#4318ff" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Week labels */}
          <div className="flex justify-between mt-2">
            {weeklyData.map((item, index) => (
              <span key={index} className="text-xs text-[#a3aed0] dark:text-gray-400">
                {item.week}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function generateLinePath(data: Array<{ week: string; completed: number }>): string {
  if (data.length === 0) return "";

  const max = Math.max(...data.map((d) => d.completed));
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 700;
    const value = (item.completed / max) * 150;
    const y = 180 - value - 15;
    return `${x},${y}`;
  });

  return `M ${points.join(" L ")}`;
}

function generateAreaPath(data: Array<{ week: string; completed: number }>): string {
  if (data.length === 0) return "";

  const max = Math.max(...data.map((d) => d.completed));
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 700;
    const value = (item.completed / max) * 150;
    const y = 180 - value - 15;
    return `${x},${y}`;
  });

  return `M 0,180 L ${points.join(" L ")} L 700,180 Z`;
}
