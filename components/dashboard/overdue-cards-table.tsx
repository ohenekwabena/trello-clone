"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink, Clock, Calendar as CalendarIcon } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface OverdueCard {
  id: string;
  title: string;
  dueDate: string | null;
  boardName: string;
}

interface OverdueCardsTableProps {
  cards: OverdueCard[];
}

export function OverdueCardsTable({ cards }: OverdueCardsTableProps) {
  const sortedCards = [...cards].sort((a, b) => {
    if (!a.dueDate || !b.dueDate) return 0;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Overdue Cards</h3>
              {cards.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {cards.length}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Cards that need immediate attention</p>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="mb-4 rounded-full bg-green-100 p-4 dark:bg-green-900/30">
              <AlertCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm">No overdue cards at the moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Card Title</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Board</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Due Date</th>
                  <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Overdue By</th>
                  <th className="pb-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCards.map((card, index) => (
                  <motion.tr
                    key={card.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group border-b transition-colors hover:bg-red-50 dark:border-gray-700 dark:hover:bg-red-900/10"
                  >
                    <td className="py-4 pr-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 rounded-full bg-red-100 p-1 dark:bg-red-900/30">
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{card.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">ID: {card.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <Badge variant="outline" className="text-xs">
                        {card.boardName}
                      </Badge>
                    </td>
                    <td className="py-4 pr-4">
                      {card.dueDate ? (
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          {format(new Date(card.dueDate), "MMM d, yyyy")}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No due date</span>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      {card.dueDate ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                            {formatDistanceToNow(new Date(card.dueDate), { addSuffix: false })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-blue-600 opacity-0 transition-opacity hover:bg-blue-700 group-hover:opacity-100"
                        >
                          Take Action
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {cards.length > 10 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 flex justify-between border-t pt-4 dark:border-gray-700"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {Math.min(10, cards.length)} of {cards.length} overdue cards
            </p>
            <Button variant="ghost" size="sm">
              Load More
            </Button>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}
