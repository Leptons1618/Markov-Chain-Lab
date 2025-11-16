"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trophy, Zap, Award, Info } from "lucide-react"
import type { RewardStats } from "@/lib/rewards"

interface RewardsDisplayProps {
  stats: RewardStats
  compact?: boolean
}

export function RewardsDisplay({ stats, compact = false }: RewardsDisplayProps) {
  const unlockedAchievements = stats.achievements.filter(a => a.unlocked)
  const lockedAchievements = stats.achievements.filter(a => !a.unlocked)

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm">{stats.totalPoints} Points</div>
                <div className="text-xs text-muted-foreground">
                  {unlockedAchievements.length} achievements • {stats.streak} day streak
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                <Zap className="h-3 w-3 mr-1" />
                {stats.streak}
              </Badge>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      Rewards & Achievements System
                    </DialogTitle>
                    <DialogDescription>
                      Learn how to earn points and unlock achievements
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <h3 className="font-semibold mb-2">How Points Work</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Earn points by completing lessons and unlocking achievements. Points are a fun way to track your learning progress!
                      </p>
                      <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                        <li>Complete your first lesson: 10 points</li>
                        <li>Complete 5 lessons: 25 points</li>
                        <li>Complete 10 lessons: 50 points</li>
                        <li>Complete a course: 100 points</li>
                        <li>Complete all courses: 500 points</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Learning Streaks</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Maintain your learning momentum by completing lessons daily. Your streak resets if you miss a day.
                      </p>
                      <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                        <li>3-day streak: 30 points</li>
                        <li>7-day streak: 75 points</li>
                        <li>30-day streak: 200 points</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Achievements</h3>
                      <p className="text-sm text-muted-foreground">
                        Unlock achievements as you progress through your learning journey. Each achievement comes with bonus points!
                      </p>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        💡 <strong>Tip:</strong> Sign in to save your progress and achievements across devices. In guest mode, your data is stored locally and may be lost if you clear your browser data.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Achievements & Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.totalPoints}</div>
            <div className="text-xs text-muted-foreground">Total Points</div>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{unlockedAchievements.length}</div>
            <div className="text-xs text-muted-foreground">Achievements</div>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.streak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
        </div>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Unlocked ({unlockedAchievements.length})
            </h4>
            <div className="space-y-2">
              {unlockedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center justify-between p-2 bg-background/50 rounded-lg border border-primary/20"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{achievement.icon}</span>
                    <div>
                      <div className="text-sm font-medium">{achievement.title}</div>
                      <div className="text-xs text-muted-foreground">{achievement.description}</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    +{achievement.points}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements Preview */}
        {lockedAchievements.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
              Locked ({lockedAchievements.length})
            </h4>
            <div className="space-y-2">
              {lockedAchievements.slice(0, 3).map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center justify-between p-2 bg-background/30 rounded-lg opacity-60"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl grayscale">{achievement.icon}</span>
                    <div>
                      <div className="text-sm font-medium">{achievement.title}</div>
                      <div className="text-xs text-muted-foreground">{achievement.description}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="opacity-50">
                    +{achievement.points}
                  </Badge>
                </div>
              ))}
              {lockedAchievements.length > 3 && (
                <div className="text-xs text-center text-muted-foreground pt-1">
                  +{lockedAchievements.length - 3} more achievements to unlock
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
