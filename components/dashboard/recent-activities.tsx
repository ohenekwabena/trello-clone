"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare, User, Move, Plus, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: string;
  description: string;
  cardTitle: string;
  cardId: string | null;
  boardName: string;
  boardId: string | null;
  actorName: string;
  actorAvatar: string | null;
  actorId: string | null;
  timestamp: string;
  date: string;
  time: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
}

const activityIcons = {
  card_created: Plus,
  card_moved: Move,
  card_assigned: User,
  card_unassigned: User,
  card_updated: Pencil,
  card_deleted: Trash2,
  card_due_date_set: Clock,
  card_due_date_changed: Clock,
  card_due_date_removed: Clock,
  comment_added: MessageSquare,
};

const activityColors = {
  card_created: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  card_moved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  card_assigned: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  card_unassigned: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  card_updated: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  card_deleted: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  card_due_date_set: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  card_due_date_changed: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  card_due_date_removed: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  comment_added: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
};

export function RecentActivities({ activities }: RecentActivitiesProps) {
  console.log("Recent activities: ", activities);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="p-6">
        <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Latest updates across all boards</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Last 24h
          </Badge>
        </div>

        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-gray-500 dark:text-gray-400">
              No recent activity
            </div>
          ) : (
            activities.map((activity, index) => {
              const Icon = activityIcons[activity.type as keyof typeof activityIcons] || MessageSquare;
              const colorClass =
                activityColors[activity.type as keyof typeof activityColors] ||
                "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group flex flex-col items-start gap-4 rounded-lg border p-4 transition-all hover:border-blue-500 hover:bg-blue-50/50 dark:border-gray-700 dark:hover:bg-blue-900/10 sm:flex-row sm:items-start"
                >
                  {/* Avatar */}
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    {activity.actorAvatar ? (
                      <img src={activity.actorAvatar} alt={activity.actorName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {activity.actorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 flex flex-col justify-between  min-w-0">
                        <p className="text-sm  text-gray-900 dark:text-white">
                          <span className="font-semibold mr-2 ">{activity.actorName}</span>
                          <span className="text-gray-600 dark:text-gray-400">{activity.description}</span>
                        </p>
                        {/* {activity.cardId && (
                          <p className="mt-1 truncate text-sm font-medium text-blue-600 dark:text-blue-400">
                            {activity.cardTitle}
                          </p>
                        )} */}
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{activity.boardName}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                        </div>
                      </div>

                      {/* Icon Badge */}
                      <div className={`rounded-lg p-2 ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* {activities.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-center"
          >
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              View all activity →
            </button>
          </motion.div>
        )} */}
      </Card>
    </motion.div>
  );
}
