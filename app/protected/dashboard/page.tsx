import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getDashboardOverview,
  getTrendData,
  getBoardActivitySummary,
  getActivityTimeline,
  getDueDateBreakdown,
  getTeamCollaboration,
} from "@/lib/actions/dashboard";
import {
  OverviewStats,
  TrendChart,
  BoardActivityChart,
  RecentActivities,
  DueDateCalendar,
  OverdueCardsTable,
  TeamCollaboration,
  DashboardLoadingSkeleton,
} from "@/components/dashboard";

export const metadata = {
  title: "Dashboard | Trello Clone",
  description: "Your personal project management dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch all dashboard data in parallel
  const [overviewResult, trendResult, boardActivityResult, activityTimelineResult, dueDateResult, teamCollabResult] =
    await Promise.all([
      getDashboardOverview(),
      getTrendData(),
      getBoardActivitySummary(),
      getActivityTimeline(20),
      getDueDateBreakdown(),
      getTeamCollaboration(),
    ]);

  const overview = overviewResult.data;
  const trendData = trendResult.data || [];
  const boardActivity = boardActivityResult.data || [];
  const activities = activityTimelineResult.data || [];
  const dueDates = dueDateResult.data;
  const teamCollab = teamCollabResult.data;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 my-8 rounded-xl">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">Your Dashboard</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Here's what's happening with your projects today</p>
        </div>

        <Suspense fallback={<DashboardLoadingSkeleton />}>
          <div className="space-y-6">
            {/* Overview Stats */}
            {overview && <OverviewStats data={overview} />}

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Trend Chart */}
              {trendData.length > 0 && <TrendChart data={trendData} />}

              {/* Board Activity */}
              {boardActivity.length > 0 && <BoardActivityChart data={boardActivity} />}
            </div>

            {/* Recent Activities & Due Dates */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent Activities */}
              {activities.length > 0 && <RecentActivities activities={activities} />}

              {/* Due Date Calendar */}
              {dueDates && <DueDateCalendar data={dueDates} />}
            </div>

            {/* Overdue Cards Table */}
            {dueDates && dueDates.overdue && <OverdueCardsTable cards={dueDates.overdue} />}

            {/* Team Collaboration */}
            {teamCollab && <TeamCollaboration data={teamCollab} />}
          </div>
        </Suspense>
      </div>
    </div>
  );
}
