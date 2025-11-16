/**
 * Reward system for learning achievements
 */

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  points: number
  unlocked: boolean
  unlockedAt?: string
}

export interface RewardStats {
  totalPoints: number
  achievements: Achievement[]
  streak: number
  lastCompletedDate?: string
}

const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  {
    id: 'first-lesson',
    title: 'Getting Started',
    description: 'Complete your first lesson',
    icon: '🎯',
    points: 10
  },
  {
    id: 'five-lessons',
    title: 'Building Momentum',
    description: 'Complete 5 lessons',
    icon: '🔥',
    points: 25
  },
  {
    id: 'ten-lessons',
    title: 'Dedicated Learner',
    description: 'Complete 10 lessons',
    icon: '⭐',
    points: 50
  },
  {
    id: 'course-complete',
    title: 'Course Master',
    description: 'Complete an entire course',
    icon: '🏆',
    points: 100
  },
  {
    id: 'all-courses',
    title: 'Markov Master',
    description: 'Complete all courses',
    icon: '👑',
    points: 500
  },
  {
    id: 'three-day-streak',
    title: 'Consistent',
    description: 'Maintain a 3-day learning streak',
    icon: '📅',
    points: 30
  },
  {
    id: 'week-streak',
    title: 'Committed',
    description: 'Maintain a 7-day learning streak',
    icon: '💪',
    points: 75
  },
  {
    id: 'month-streak',
    title: 'Unstoppable',
    description: 'Maintain a 30-day learning streak',
    icon: '🚀',
    points: 200
  }
]

/**
 * Calculate current streak based on completion dates
 */
export function calculateStreak(progress: Record<string, { completed: boolean; lastAccessedAt?: string }>): number {
  const completedLessons = Object.values(progress).filter(p => p.completed && p.lastAccessedAt)
  if (completedLessons.length === 0) return 0

  const dates = completedLessons
    .map(p => new Date(p.lastAccessedAt!))
    .sort((a, b) => b.getTime() - a.getTime())

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Check if there's activity today or yesterday
  const lastDate = dates[0]
  const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff > 1) return 0 // Streak broken

  // Count consecutive days
  let currentDate = new Date(today)
  if (daysDiff === 0) {
    // Activity today, start counting from today
    streak = 1
  } else {
    // Activity yesterday, start counting from yesterday
    streak = 1
    currentDate.setDate(currentDate.getDate() - 1)
  }

  for (let i = 1; i < dates.length; i++) {
    const checkDate = new Date(currentDate)
    checkDate.setDate(checkDate.getDate() - 1)
    
    const found = dates.find(d => {
      const dDate = new Date(d)
      dDate.setHours(0, 0, 0, 0)
      return dDate.getTime() === checkDate.getTime()
    })

    if (found) {
      streak++
      currentDate = checkDate
    } else {
      break
    }
  }

  return streak
}

/**
 * Check and unlock achievements based on progress
 */
export function checkAchievements(
  progress: Record<string, { completed: boolean; lastAccessedAt?: string }>,
  courseLessonsMap: Record<string, string[]> // Maps courseId to array of lessonIds
): Achievement[] {
  const completedLessons = Object.values(progress).filter(p => p.completed).length
  const streak = calculateStreak(progress)
  
  // Count completed courses
  const completedCourses = Object.entries(courseLessonsMap).filter(([courseId, lessonIds]) => {
    if (lessonIds.length === 0) return false
    return lessonIds.every(lessonId => progress[lessonId]?.completed)
  }).length

  const totalCourses = Object.keys(courseLessonsMap).length

  return ACHIEVEMENTS.map(achievement => {
    let unlocked = false
    let unlockedAt: string | undefined

    switch (achievement.id) {
      case 'first-lesson':
        unlocked = completedLessons >= 1
        break
      case 'five-lessons':
        unlocked = completedLessons >= 5
        break
      case 'ten-lessons':
        unlocked = completedLessons >= 10
        break
      case 'course-complete':
        unlocked = completedCourses >= 1
        break
      case 'all-courses':
        unlocked = completedCourses >= totalCourses && totalCourses > 0
        break
      case 'three-day-streak':
        unlocked = streak >= 3
        break
      case 'week-streak':
        unlocked = streak >= 7
        break
      case 'month-streak':
        unlocked = streak >= 30
        break
    }

    // Find when achievement was unlocked (simplified - use most recent completion)
    if (unlocked) {
      const completedDates = Object.values(progress)
        .filter(p => p.completed && p.lastAccessedAt)
        .map(p => p.lastAccessedAt!)
        .sort()
        .reverse()
      
      if (completedDates.length > 0) {
        unlockedAt = completedDates[0]
      }
    }

    return {
      ...achievement,
      unlocked,
      unlockedAt
    }
  })
}

/**
 * Calculate total points from achievements
 */
export function calculateTotalPoints(achievements: Achievement[]): number {
  return achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0)
}

/**
 * Get reward stats from localStorage
 */
export function getRewardStats(
  progress: Record<string, { completed: boolean; lastAccessedAt?: string }>,
  courseLessonsMap: Record<string, string[]> // Maps courseId to array of lessonIds
): RewardStats {
  const achievements = checkAchievements(progress, courseLessonsMap)
  const totalPoints = calculateTotalPoints(achievements)
  const streak = calculateStreak(progress)

  const completedDates = Object.values(progress)
    .filter(p => p.completed && p.lastAccessedAt)
    .map(p => p.lastAccessedAt!)
    .sort()
    .reverse()

  return {
    totalPoints,
    achievements,
    streak,
    lastCompletedDate: completedDates[0]
  }
}
