"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down";
  gradient?: boolean;
  chartData?: number[];
  className?: string;
}

export function StatCard({ title, value, change, trend, gradient = false, chartData, className = "" }: StatCardProps) {
  const isPositive = trend === "up" || (change && change > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card
        className={`relative h-24 overflow-hidden border-none ${
          gradient ? "bg-gradient-to-br from-[#4318ff] to-[#6b46ff] text-white" : "bg-white dark:bg-gray-800"
        }`}
      >
        <div className="p-5 relative z-10">
          <p className={`text-sm font-medium mb-2 ${gradient ? "text-white/80" : "text-[#a3aed0] dark:text-gray-400"}`}>
            {title}
          </p>
          <div className="flex items-center justify-between">
            <motion.p
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`text-2xl font-bold ${gradient ? "text-white" : "text-[#1b2559] dark:text-white"}`}
            >
              {value}
            </motion.p>

            {change !== undefined && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${
                  isPositive
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(change)}%
              </motion.div>
            )}
          </div>
        </div>

        {/* Mini chart visualization */}
        {chartData && chartData.length > 0 && (
          <div className="absolute bottom-0 right-0 w-24 h-10 opacity-30">
            <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                d={generateChartPath(chartData)}
                fill="none"
                stroke={gradient ? "white" : "#4318ff"}
                strokeWidth="2"
              />
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        {gradient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10"
          />
        )}
      </Card>
    </motion.div>
  );
}

function generateChartPath(data: number[]): string {
  if (data.length === 0) return "";

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 40 - ((value - min) / range) * 30;
    return `${x},${y}`;
  });

  return `M ${points.join(" L ")}`;
}

interface MiniChartCardProps {
  title: string;
  value: string | number;
  data: number[];
  className?: string;
}

export function MiniChartCard({ title, value, data, className = "" }: MiniChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="h-24 bg-white dark:bg-gray-800 border-none overflow-hidden">
        <div className="p-5 flex items-center justify-between h-full">
          <div>
            <p className="text-sm font-medium text-[#a3aed0] dark:text-gray-400 mb-1">{title}</p>
            <motion.p
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-2xl font-bold text-[#1b2559] dark:text-white"
            >
              {value}
            </motion.p>
          </div>

          <div className="w-20 h-16">
            <svg className="w-full h-full" viewBox="0 0 80 60" preserveAspectRatio="none">
              {/* Bars */}
              {data.map((value, index) => {
                const maxValue = Math.max(...data);
                const height = (value / maxValue) * 50;
                const x = index * 16;

                return (
                  <motion.rect
                    key={index}
                    initial={{ height: 0, y: 50 }}
                    animate={{ height, y: 50 - height }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    x={x}
                    width="10"
                    rx="2"
                    className="fill-[#4318ff]"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
