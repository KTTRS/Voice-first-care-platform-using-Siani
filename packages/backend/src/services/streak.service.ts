import prisma from "../utils/db";
import { trackStreakMaintained } from "../jobs/queues/feedQueue";

export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  isActive: boolean;
}

export class StreakService {
  /**
   * Calculate current streak for a user based on daily action completions
   */
  async calculateUserStreak(userId: string): Promise<UserStreak> {
    // Get all completed actions ordered by creation date
    const completedActions = await prisma.dailyAction.findMany({
      where: {
        userId,
        completed: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    });

    if (completedActions.length === 0) {
      return {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date(),
        isActive: false,
      };
    }

    // Group actions by date (ignoring time)
    const actionsByDate = this.groupByDate(completedActions);
    const sortedDates = Object.keys(actionsByDate).sort().reverse();

    // Calculate current streak
    const currentStreak = this.calculateConsecutiveDays(sortedDates);

    // Calculate longest streak from all dates
    const longestStreak = this.findLongestStreak(sortedDates);

    const lastActivityDate = new Date(sortedDates[0]);
    const isActive = this.isStreakActive(lastActivityDate);

    return {
      userId,
      currentStreak,
      longestStreak,
      lastActivityDate,
      isActive,
    };
  }

  /**
   * Check streaks for all active users and trigger events
   */
  async checkAllUserStreaks(): Promise<void> {
    console.log("🔥 Starting streak check for all users...");

    // Get all users who have completed actions
    const usersWithActions = await prisma.user.findMany({
      where: {
        dailyActions: {
          some: {
            completed: true,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log(`📊 Checking streaks for ${usersWithActions.length} users`);

    let streaksDetected = 0;
    const results = [];

    for (const user of usersWithActions) {
      try {
        const streak = await this.calculateUserStreak(user.id);

        // Only track if streak is active and >= 3 days (milestone)
        if (streak.isActive && streak.currentStreak >= 3) {
          // Check if we should notify about this streak
          const shouldNotify = await this.shouldNotifyStreak(
            user.id,
            streak.currentStreak
          );

          if (shouldNotify) {
            await trackStreakMaintained({
              userId: user.id,
              streakDays: streak.currentStreak,
            });

            streaksDetected++;
            results.push({
              user: `${user.firstName} ${user.lastName}`,
              streak: streak.currentStreak,
            });

            console.log(
              `🔥 Streak tracked: ${user.firstName} - ${streak.currentStreak} days`
            );
          }
        }
      } catch (error) {
        console.error(`❌ Error checking streak for user ${user.id}:`, error);
      }
    }

    console.log(
      `✅ Streak check complete: ${streaksDetected} streaks detected`
    );

    if (results.length > 0) {
      console.log("📋 Streak Summary:", results);
    }
  }

  /**
   * Get streak statistics for a user
   */
  async getUserStreakStats(userId: string): Promise<{
    current: number;
    longest: number;
    total_actions: number;
    active_days: number;
    last_activity: Date | null;
    is_active: boolean;
  }> {
    const streak = await this.calculateUserStreak(userId);

    const totalActions = await prisma.dailyAction.count({
      where: {
        userId,
        completed: true,
      },
    });

    const completedActions = await prisma.dailyAction.findMany({
      where: {
        userId,
        completed: true,
      },
      select: {
        createdAt: true,
      },
    });

    const actionsByDate = this.groupByDate(completedActions);
    const activeDays = Object.keys(actionsByDate).length;

    return {
      current: streak.currentStreak,
      longest: streak.longestStreak,
      total_actions: totalActions,
      active_days: activeDays,
      last_activity: streak.lastActivityDate,
      is_active: streak.isActive,
    };
  }

  /**
   * Helper: Group actions by date (YYYY-MM-DD)
   */
  private groupByDate(actions: { createdAt: Date }[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const action of actions) {
      const dateKey = this.getDateKey(action.createdAt);
      grouped[dateKey] = (grouped[dateKey] || 0) + 1;
    }

    return grouped;
  }

  /**
   * Helper: Convert date to YYYY-MM-DD string
   */
  private getDateKey(date: Date): string {
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  }

  /**
   * Helper: Calculate consecutive days from today backwards
   */
  private calculateConsecutiveDays(sortedDates: string[]): number {
    if (sortedDates.length === 0) return 0;

    const today = this.getDateKey(new Date());
    const yesterday = this.getDateKey(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    // Check if there's activity today or yesterday
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
      return 0; // Streak broken
    }

    let streak = 1;
    let currentDate = new Date(sortedDates[0]);

    for (let i = 1; i < sortedDates.length; i++) {
      const previousDate = new Date(sortedDates[i]);
      const daysDiff = this.getDaysDifference(currentDate, previousDate);

      if (daysDiff === 1) {
        streak++;
        currentDate = previousDate;
      } else {
        break; // Streak broken
      }
    }

    return streak;
  }

  /**
   * Helper: Find longest streak in the date array
   */
  private findLongestStreak(sortedDates: string[]): number {
    if (sortedDates.length === 0) return 0;

    let maxStreak = 1;
    let currentStreak = 1;
    let currentDate = new Date(sortedDates[0]);

    for (let i = 1; i < sortedDates.length; i++) {
      const previousDate = new Date(sortedDates[i]);
      const daysDiff = this.getDaysDifference(currentDate, previousDate);

      if (daysDiff === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }

      currentDate = previousDate;
    }

    return maxStreak;
  }

  /**
   * Helper: Get difference in days between two dates
   */
  private getDaysDifference(date1: Date, date2: Date): number {
    const d1 = this.getDateKey(date1);
    const d2 = this.getDateKey(date2);
    const diff = new Date(d1).getTime() - new Date(d2).getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Helper: Check if streak is still active (activity within last 24-48 hours)
   */
  private isStreakActive(lastActivityDate: Date): boolean {
    const now = new Date();
    const hoursSinceActivity =
      (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60);

    // Streak is active if last activity was within 48 hours
    return hoursSinceActivity <= 48;
  }

  /**
   * Helper: Determine if we should notify about this streak
   * Notify on: 3, 7, 14, 30, 60, 90, 100+ day milestones
   */
  private async shouldNotifyStreak(
    userId: string,
    streakDays: number
  ): Promise<boolean> {
    // Check if we already notified for this streak level today
    const today = this.getDateKey(new Date());

    // Get the last streak notification from feed events
    const lastNotification = await prisma.feedEvent.findFirst({
      where: {
        userId,
        type: "STREAK_MAINTAINED",
        createdAt: {
          gte: new Date(today), // Today
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // If we already notified today, don't notify again
    if (lastNotification) {
      return false;
    }

    // Notify on milestone days
    const milestones = [3, 7, 14, 21, 30, 60, 90, 100, 365];

    // Notify if current streak matches a milestone
    if (milestones.includes(streakDays)) {
      return true;
    }

    // For 100+ days, notify every 10 days
    if (streakDays >= 100 && streakDays % 10 === 0) {
      return true;
    }

    return false;
  }
}

export const streakService = new StreakService();
