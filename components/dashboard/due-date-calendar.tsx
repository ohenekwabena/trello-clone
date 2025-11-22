"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";

interface DueDateItem {
  id: string;
  title: string;
  dueDate: string | null;
  boardName: string;
}

interface DueDateCalendarProps {
  data: {
    dueToday: DueDateItem[];
    dueThisWeek: DueDateItem[];
    overdue: DueDateItem[];
    noDueDate: number;
  };
}

export function DueDateCalendar({ data }: DueDateCalendarProps) {
  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d, yyyy");
  };

  const getDueDateColor = (dateString: string | null) => {
    if (!dateString) return "text-gray-500";
    const date = new Date(dateString);
    if (isPast(date)) return "text-red-600 dark:text-red-400";
    if (isToday(date)) return "text-orange-600 dark:text-orange-400";
    return "text-blue-600 dark:text-blue-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Due Dates</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cards that need your attention</p>
          </div>
          <Calendar className="h-6 w-6 text-gray-400" />
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-gradient-to-br from-red-500 to-red-600 p-4 text-white">
            <div className="text-3xl font-bold">{data.overdue.length}</div>
            <div className="text-sm opacity-90">Overdue</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-white">
            <div className="text-3xl font-bold">{data.dueToday.length}</div>
            <div className="text-sm opacity-90">Due Today</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white">
            <div className="text-3xl font-bold">{data.dueThisWeek.length}</div>
            <div className="text-sm opacity-90">This Week</div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 p-4 text-white">
            <div className="text-3xl font-bold">{data.noDueDate}</div>
            <div className="text-sm opacity-90">No Due Date</div>
          </div>
        </div>

        {/* Due Today Section */}
        {data.dueToday.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Due Today</h4>
              <Badge variant="destructive" className="bg-orange-600">
                {data.dueToday.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {data.dueToday.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-900/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-white">{card.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{card.boardName}</p>
                  </div>
                  <div className="ml-4 flex items-center gap-1 text-xs font-semibold text-orange-600">
                    <Clock className="h-3 w-3" />
                    {formatDueDate(card.dueDate)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Due This Week Section */}
        {data.dueThisWeek.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Due This Week</h4>
              <Badge variant="secondary">{data.dueThisWeek.length}</Badge>
            </div>
            <div className="space-y-2">
              {data.dueThisWeek.slice(0, 5).map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between rounded-lg border p-3 transition-all hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-white">{card.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{card.boardName}</p>
                  </div>
                  <div
                    className={`ml-4 flex items-center gap-1 text-xs font-semibold ${getDueDateColor(card.dueDate)}`}
                  >
                    <Clock className="h-3 w-3" />
                    {formatDueDate(card.dueDate)}
                  </div>
                </motion.div>
              ))}
            </div>
            {data.dueThisWeek.length > 5 && (
              <button className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
                View {data.dueThisWeek.length - 5} more →
              </button>
            )}
          </div>
        )}

        {/* Overdue Section */}
        {data.overdue.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Overdue</h4>
              <Badge variant="destructive">{data.overdue.length}</Badge>
            </div>
            <div className="space-y-2">
              {data.overdue.slice(0, 3).map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-white">{card.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{card.boardName}</p>
                  </div>
                  <div className="ml-4 flex items-center gap-1 text-xs font-semibold text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {formatDueDate(card.dueDate)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {data.dueToday.length === 0 && data.dueThisWeek.length === 0 && data.overdue.length === 0 && (
          <div className="flex h-40 items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Calendar className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p>No upcoming due dates</p>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
