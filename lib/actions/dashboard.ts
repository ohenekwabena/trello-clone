import { createClient } from "@/lib/supabase/server";

/**
 * Get overview statistics for the dashboard
 */
export async function getDashboardOverview() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const userId = user.id;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get all cards assigned to user
  const { data: assignedCards } = await supabase
    .from("cards")
    .select(
      `
      id,
      due_date,
      list_id,
      list:lists!cards_list_id_fkey(id, title)
    `
    )
    .eq("assigned_to", userId);

  // Get cards created by user this month
  const { data: createdThisMonth } = await supabase
    .from("cards")
    .select("id")
    .eq("created_by", userId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Get "Done" list IDs (assuming lists with "done" or "complete" in title are completion lists)
  const { data: doneLists } = await supabase.from("lists").select("id").or("title.ilike.%done%,title.ilike.%complete%");

  const doneListIds = new Set(doneLists?.map((l) => l.id) || []);

  // Calculate completed cards (cards in done lists)
  const completedCards = assignedCards?.filter((card) => doneListIds.has(card.list_id)) || [];

  // Calculate overdue cards
  const overdueCards =
    assignedCards?.filter((card) => card.due_date && new Date(card.due_date) < now && !doneListIds.has(card.list_id)) ||
    [];

  // Get activities for completion rate
  const { data: completionActivities } = await supabase
    .from("card_activities")
    .select("id, card_id")
    .eq("actor_id", userId)
    .eq("activity_type", "moved_card")
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Calculate completion rate
  const totalAssigned = assignedCards?.length || 0;
  const completionRate = totalAssigned > 0 ? (completedCards.length / totalAssigned) * 100 : 0;

  return {
    data: {
      totalActiveCards: totalAssigned - completedCards.length,
      overdueCards: overdueCards.length,
      cardsCreatedThisMonth: createdThisMonth?.length || 0,
      completionRate: Math.round(completionRate),
      completedThisMonth: completionActivities?.length || 0,
    },
  };
}

/**
 * Get due date breakdown
 */
export async function getDueDateBreakdown() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const userId = user.id;
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Get done lists
  const { data: doneLists } = await supabase.from("lists").select("id").or("title.ilike.%done%,title.ilike.%complete%");

  const doneListIds = new Set(doneLists?.map((l) => l.id) || []);

  // Get all assigned cards with due dates
  const { data: cards } = await supabase
    .from("cards")
    .select(
      `
      id,
      title,
      due_date,
      list_id,
      board:boards!cards_board_id_fkey(id, name)
    `
    )
    .eq("assigned_to", userId)
    .not("due_date", "is", null);

  // Filter out completed cards
  const activeCards = cards?.filter((card) => !doneListIds.has(card.list_id)) || [];

  const dueToday = activeCards.filter((card) => new Date(card.due_date!) <= todayEnd);

  const dueThisWeek = activeCards.filter((card) => {
    const dueDate = new Date(card.due_date!);
    return dueDate > todayEnd && dueDate <= weekEnd;
  });

  const overdue = activeCards.filter((card) => new Date(card.due_date!) < now);

  const noDueDate = await supabase
    .from("cards")
    .select("id", { count: "exact" })
    .eq("assigned_to", userId)
    .is("due_date", null);

  return {
    data: {
      dueToday: dueToday.map((card: any) => ({
        id: card.id,
        title: card.title,
        dueDate: card.due_date,
        boardName: card.board?.name || "Unknown",
      })),
      dueThisWeek: dueThisWeek.map((card: any) => ({
        id: card.id,
        title: card.title,
        dueDate: card.due_date,
        boardName: card.board?.name || "Unknown",
      })),
      overdue: overdue.map((card: any) => ({
        id: card.id,
        title: card.title,
        dueDate: card.due_date,
        boardName: card.board?.name || "Unknown",
      })),
      noDueDate: noDueDate.count || 0,
    },
  };
}

/**
 * Get activity timeline
 */
export async function getActivityTimeline(limit: number = 20) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const userId = user.id;

  // Get boards the user has access to
  const { data: userBoards } = await supabase.from("organization_members").select("org_id").eq("user_id", userId);

  const orgIds = userBoards?.map((m) => m.org_id) || [];

  const { data: accessibleBoards } = await supabase.from("boards").select("id").in("org_id", orgIds);

  const boardIds = accessibleBoards?.map((b) => b.id) || [];

  // Get recent activities from accessible boards
  const { data: activities } = await supabase
    .from("card_activities")
    .select(
      `
      id,
      activity_type,
      created_at,
      payload,
      card:cards!card_activities_card_id_fkey(id, title),
      board:boards!card_activities_board_id_fkey(id, name),
      actor:user_profiles!card_activities_actor_id_fkey(id, email, display_name, avatar_url)
    `
    )
    .in("board_id", boardIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  return {
    data:
      activities?.map((activity: any) => ({
        id: activity.id,
        type: activity.activity_type,
        description: formatActivityDescription(activity),
        cardTitle: activity.card?.title || "Unknown Card",
        cardId: activity.card?.id || null,
        boardName: activity.board?.name || "Unknown Board",
        boardId: activity.board?.id || null,
        actorName: activity.actor?.display_name || activity.actor?.email || "Unknown",
        actorAvatar: activity.actor?.avatar_url || null,
        actorId: activity.actor?.id || null,
        timestamp: activity.created_at,
        date: new Date(activity.created_at).toLocaleDateString(),
        time: new Date(activity.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      })) || [],
  };
}

/**
 * Get board activity summary
 */
export async function getBoardActivitySummary() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const userId = user.id;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get accessible boards
  const { data: userBoards } = await supabase.from("organization_members").select("org_id").eq("user_id", userId);

  const orgIds = userBoards?.map((m) => m.org_id) || [];

  const { data: boards } = await supabase
    .from("boards")
    .select("id, name, description, background_color, org_id")
    .in("org_id", orgIds);

  if (!boards || boards.length === 0) {
    return { data: [], error: null };
  }

  const boardIds = boards.map((b) => b.id);

  // Get activity counts per board
  const { data: activities } = await supabase
    .from("card_activities")
    .select("board_id")
    .in("board_id", boardIds)
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Get card counts per board
  const { data: cards } = await supabase.from("cards").select("board_id, list_id").in("board_id", boardIds);

  // Get done lists
  const { data: doneLists } = await supabase.from("lists").select("id").or("title.ilike.%done%,title.ilike.%complete%");

  const doneListIds = new Set(doneLists?.map((l) => l.id) || []);

  // Group by board
  const activityCountByBoard = activities?.reduce((acc, activity) => {
    acc[activity.board_id] = (acc[activity.board_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cardsByBoard = cards?.reduce((acc, card) => {
    if (!acc[card.board_id]) {
      acc[card.board_id] = { total: 0, completed: 0 };
    }
    acc[card.board_id].total += 1;
    if (doneListIds.has(card.list_id)) {
      acc[card.board_id].completed += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  return {
    data: boards.map((board) => ({
      id: board.id,
      name: board.name,
      description: board.description,
      backgroundColor: board.background_color,
      orgId: board.org_id,
      activityCount: activityCountByBoard?.[board.id] || 0,
      totalCards: cardsByBoard?.[board.id]?.total || 0,
      completedCards: cardsByBoard?.[board.id]?.completed || 0,
      inProgressCards: (cardsByBoard?.[board.id]?.total || 0) - (cardsByBoard?.[board.id]?.completed || 0),
    })),
  };
}

/**
 * Get trend data for charts (last 30 days)
 */
export async function getTrendData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const userId = user.id;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get cards created in last 30 days
  const { data: createdCards } = await supabase
    .from("cards")
    .select("created_at")
    .eq("created_by", userId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Get completion activities in last 30 days
  const { data: completionActivities } = await supabase
    .from("card_activities")
    .select("created_at")
    .eq("actor_id", userId)
    .eq("activity_type", "moved_card")
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Group by day
  const dailyData: Record<string, { created: number; completed: number }> = {};

  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().split("T")[0];
    dailyData[dateKey] = { created: 0, completed: 0 };
  }

  createdCards?.forEach((card) => {
    const dateKey = new Date(card.created_at).toISOString().split("T")[0];
    if (dailyData[dateKey]) {
      dailyData[dateKey].created += 1;
    }
  });

  completionActivities?.forEach((activity) => {
    const dateKey = new Date(activity.created_at).toISOString().split("T")[0];
    if (dailyData[dateKey]) {
      dailyData[dateKey].completed += 1;
    }
  });

  // Convert to array and sort by date
  const trendArray = Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      created: data.created,
      completed: data.completed,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return { data: trendArray };
}

/**
 * Get team collaboration stats
 */
export async function getTeamCollaboration() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Not authenticated" };
  }

  const userId = user.id;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get user's organizations
  const { data: userOrgs } = await supabase.from("organization_members").select("org_id").eq("user_id", userId);

  const orgIds = userOrgs?.map((m) => m.org_id) || [];

  // Get all members in user's organizations
  const { data: teamMembers } = await supabase
    .from("organization_members")
    .select(
      `
      user_id,
      profile:user_profiles!organization_members_user_id_fkey(id, email, display_name, avatar_url)
    `
    )
    .in("org_id", orgIds)
    .neq("user_id", userId);

  const memberIds = teamMembers?.map((m) => m.user_id) || [];

  // Get recent activities by team members
  const { data: activities } = await supabase
    .from("card_activities")
    .select("actor_id")
    .in("actor_id", memberIds)
    .gte("created_at", sevenDaysAgo.toISOString());

  // Count activities per member
  const activityCounts = activities?.reduce((acc, activity) => {
    acc[activity.actor_id] = (acc[activity.actor_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get recent assignments
  const { data: recentAssignments } = await supabase
    .from("card_activities")
    .select(
      `
      id,
      created_at,
      payload,
      card:cards!card_activities_card_id_fkey(id, title),
      actor:user_profiles!card_activities_actor_id_fkey(id, email, display_name, avatar_url)
    `
    )
    .eq("activity_type", "assigned_card")
    .or(`actor_id.eq.${userId},payload->>assigned_to.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(10);

  const mostActiveMembers = teamMembers
    ?.map((member: any) => {
      const profile = member.profile;
      return {
        id: member.user_id,
        displayName: profile?.display_name || profile?.email || "Unknown",
        avatarUrl: profile?.avatar_url,
        activityCount: activityCounts?.[member.user_id] || 0,
      };
    })
    .sort((a, b) => b.activityCount - a.activityCount)
    .slice(0, 5);

  return {
    data: {
      mostActiveMembers: mostActiveMembers || [],
      recentAssignments:
        recentAssignments?.map((assignment: any) => ({
          id: assignment.id,
          cardTitle: assignment.card?.title || "Unknown",
          cardId: assignment.card?.id || null,
          actorName: assignment.actor?.display_name || assignment.actor?.email || "Unknown",
          actorAvatar: assignment.actor?.avatar_url || null,
          assignedTo: assignment.payload?.assigned_to,
          date: new Date(assignment.created_at).toLocaleDateString(),
          timestamp: assignment.created_at,
        })) || [],
    },
  };
}

/**
 * Helper function to format activity descriptions
 */
function formatActivityDescription(activity: any): string {
  const cardTitle = activity.card?.title || "a card";
  console.log("Formatting activity description for activity: ", activity);
  switch (activity.activity_type) {
    case "card_created":
      return `created ${cardTitle}`;
    case "card_updated":
      return `updated ${cardTitle}`;
    case "card_moved":
      return `moved ${cardTitle}`;
    case "card_assigned":
      return `assigned ${cardTitle}`;
    case "card_unassigned":
      return `unassigned ${cardTitle}`;
    case "card_due_date_set":
      return `set due date for ${cardTitle}`;
    case "card_due_date_changed":
      return `changed due date for ${cardTitle}`;
    case "card_due_date_removed":
      return `removed due date from ${cardTitle}`;
    case "comment_added":
      return `commented on ${cardTitle}`;
    default:
      return `performed action on ${cardTitle}`;
  }
}
