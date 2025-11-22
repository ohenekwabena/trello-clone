"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Award } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TeamMember {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  activityCount: number;
}

interface Assignment {
  id: string;
  cardTitle: string;
  cardId: string | null;
  actorName: string;
  actorAvatar: string | null;
  assignedTo: string;
  date: string;
  timestamp: string;
}

interface TeamCollaborationProps {
  data: {
    mostActiveMembers: TeamMember[];
    recentAssignments: Assignment[];
  };
}

export function TeamCollaboration({ data }: TeamCollaborationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="p-4 sm:p-6">
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">Team Collaboration</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              Team activity in the last 7 days
            </p>
          </div>
          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 flex-shrink-0 ml-2" />
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          {/* Most Active Members */}
          <div className="min-w-0">
            <div className="mb-3 sm:mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">Most Active</h4>
            </div>

            {data.mostActiveMembers.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                No team activity yet
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {data.mostActiveMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between rounded-lg border p-2 sm:p-3 transition-all hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-900/20"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      {index === 0 && (
                        <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-yellow-400 flex-shrink-0">
                          <Award className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                      )}
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.displayName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                            {member.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                          {member.displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {member.activityCount} activities
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={index === 0 ? "default" : "secondary"}
                      className={`${index === 0 ? "bg-blue-600" : ""} flex-shrink-0 ml-2 text-xs`}
                    >
                      #{index + 1}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Assignments */}
          <div className="min-w-0">
            <div className="mb-3 sm:mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                Recent Assignments
              </h4>
            </div>

            {data.recentAssignments.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                No recent assignments
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {data.recentAssignments.slice(0, 5).map((assignment, index) => (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="group rounded-lg border p-2 sm:p-3 transition-all hover:border-purple-500 hover:bg-purple-50 dark:border-gray-700 dark:hover:bg-purple-900/20"
                  >
                    <div className="flex items-start justify-between min-w-0">
                      <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                          {assignment.actorAvatar ? (
                            <img
                              src={assignment.actorAvatar}
                              alt={assignment.actorName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs">
                              {assignment.actorName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm">
                            <span className="font-semibold text-gray-900 dark:text-white truncate inline-block max-w-[100px] sm:max-w-none align-bottom">
                              {assignment.actorName}
                            </span>{" "}
                            <span className="text-gray-600 dark:text-gray-400">assigned</span>
                          </p>
                          <p className="mt-0.5 truncate text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
                            {assignment.cardTitle}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                            {formatDistanceToNow(new Date(assignment.timestamp), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Team Stats */}
        <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4 border-t pt-4 sm:pt-6 dark:border-gray-700">
          <div className="text-center">
            <div className="mb-1 text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.mostActiveMembers.length}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 px-1">Active Members</div>
          </div>
          <div className="text-center">
            <div className="mb-1 text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {data.recentAssignments.length}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 px-1">Assignments</div>
          </div>
          <div className="text-center">
            <div className="mb-1 text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {data.mostActiveMembers.reduce((sum, m) => sum + m.activityCount, 0)}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 px-1">Total Activities</div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
