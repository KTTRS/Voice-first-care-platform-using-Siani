import prisma from "../utils/db";

export interface FeedItem {
  id: string;
  type:
    | "GOAL_CREATED"
    | "GOAL_COMPLETED"
    | "DAILY_ACTION_COMPLETED"
    | "MEMORY_MOMENT"
    | "MILESTONE"
    | "STREAK_MAINTAINED"
    | "RESOURCE_USED";
  userId: string;
  content: string;
  metadata: any;
  createdAt: Date;
}

export class FeedService {
  async createFeedItem(data: {
    type: FeedItem["type"];
    userId: string;
    content: string;
    metadata?: any;
  }): Promise<any> {
    // For now, we'll store feed items in memory or you could create a Feed table
    // This is a simple implementation - you could extend with a dedicated Feed model
    console.log("📢 Feed Item Created:", {
      type: data.type,
      userId: data.userId,
      content: data.content.substring(0, 50) + "...",
    });

    // You could store this in a database table, cache, or in-memory store
    // For now, we'll just log it and return the event
    return {
      id: `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.type,
      userId: data.userId,
      content: data.content,
      metadata: data.metadata || {},
      createdAt: new Date(),
    };
  }

  async getUserFeed(userId: string, limit: number = 20): Promise<FeedItem[]> {
    // This would query a Feed table or cache
    // For now, we'll construct feed from goals and actions
    const goals = await prisma.goal.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        dailyActions: {
          where: { completed: true },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const feedItems: FeedItem[] = [];

    for (const goal of goals) {
      // Goal creation event
      feedItems.push({
        id: `goal_${goal.id}`,
        type: "GOAL_CREATED",
        userId: goal.userId,
        content: `Set a new goal: "${goal.title}" (${goal.points} points)`,
        metadata: {
          goalId: goal.id,
          title: goal.title,
          points: goal.points,
          isActive: goal.isActive,
        },
        createdAt: goal.createdAt,
      });

      // Daily action completions
      for (const action of goal.dailyActions) {
        if (action.completed) {
          feedItems.push({
            id: `action_${action.id}`,
            type: "DAILY_ACTION_COMPLETED",
            userId: action.userId,
            content: `Completed: ${action.content} (+${action.points} points)`,
            metadata: {
              actionId: action.id,
              goalId: goal.id,
              points: action.points,
            },
            createdAt: action.createdAt,
          });
        }
      }
    }

    // Sort by createdAt descending
    feedItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return feedItems.slice(0, limit);
  }

  async getCommunityFeed(limit: number = 50): Promise<FeedItem[]> {
    // Get recent goals from all users for community feed
    const recentGoals = await prisma.goal.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    const feedItems: FeedItem[] = recentGoals.map((goal) => ({
      id: `goal_${goal.id}`,
      type: "GOAL_CREATED",
      userId: goal.userId,
      content: `${goal.user?.firstName || "Someone"} set a new goal: "${
        goal.title
      }"`,
      metadata: {
        goalId: goal.id,
        title: goal.title,
        points: goal.points,
        userRole: goal.user?.role,
      },
      createdAt: goal.createdAt,
    }));

    return feedItems;
  }

  async getGoalMilestones(userId: string): Promise<any[]> {
    // Calculate milestones (total points, goals completed, streaks, etc.)
    const allGoals = await prisma.goal.findMany({
      where: { userId },
      include: {
        dailyActions: {
          where: { completed: true },
        },
      },
    });

    const totalPoints = allGoals.reduce((sum, goal) => {
      const actionPoints = goal.dailyActions.reduce((s, a) => s + a.points, 0);
      return sum + actionPoints;
    }, 0);

    const completedActions = allGoals.reduce(
      (sum, goal) => sum + goal.dailyActions.length,
      0
    );

    return [
      {
        type: "TOTAL_POINTS",
        value: totalPoints,
        message: `Earned ${totalPoints} total points!`,
      },
      {
        type: "COMPLETED_ACTIONS",
        value: completedActions,
        message: `Completed ${completedActions} actions!`,
      },
      {
        type: "ACTIVE_GOALS",
        value: allGoals.filter((g) => g.isActive).length,
        message: `${allGoals.filter((g) => g.isActive).length} active goals`,
      },
    ];
  }
}

export const feedService = new FeedService();
