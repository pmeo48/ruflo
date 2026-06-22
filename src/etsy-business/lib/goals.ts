export interface RevenueGoal {
  id: string
  month: string // "2025-01"
  targetRevenue: number
  actualRevenue: number
  unitsSold: number
  avgOrderValue: number
  notes: string
  createdAt: string
}

export interface GoalProjection {
  daysLeft: number
  revenueNeeded: number
  dailyRateRequired: number
  currentDailyRate: number
  onTrack: boolean
  projectedRevenue: number
  gapAmount: number
  unitsNeeded: number
}

export function getCurrentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthLabel(key: string): string {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function getDaysInMonth(key: string): number {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month, 0).getDate()
}

export function getDayOfMonth(): number {
  return new Date().getDate()
}

export function computeProjection(goal: RevenueGoal): GoalProjection {
  const totalDays = getDaysInMonth(goal.month)
  const daysPassed = Math.min(getDayOfMonth(), totalDays)
  const daysLeft = totalDays - daysPassed

  const currentDailyRate = daysPassed > 0 ? goal.actualRevenue / daysPassed : 0
  const projectedRevenue = currentDailyRate * totalDays
  const revenueNeeded = Math.max(0, goal.targetRevenue - goal.actualRevenue)
  const dailyRateRequired = daysLeft > 0 ? revenueNeeded / daysLeft : revenueNeeded
  const avgOrder = goal.avgOrderValue > 0 ? goal.avgOrderValue : 25
  const unitsNeeded = Math.ceil(revenueNeeded / avgOrder)

  return {
    daysLeft,
    revenueNeeded,
    dailyRateRequired,
    currentDailyRate,
    onTrack: projectedRevenue >= goal.targetRevenue * 0.9,
    projectedRevenue,
    gapAmount: Math.max(0, goal.targetRevenue - projectedRevenue),
    unitsNeeded,
  }
}

const STORAGE_KEY = 'etsy_revenue_goals'

export function loadGoals(): RevenueGoal[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveGoals(goals: RevenueGoal[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
}

export function upsertGoal(goals: RevenueGoal[], goal: RevenueGoal): RevenueGoal[] {
  const idx = goals.findIndex((g) => g.id === goal.id)
  if (idx >= 0) {
    const next = [...goals]
    next[idx] = goal
    return next
  }
  return [goal, ...goals]
}

export function deleteGoal(goals: RevenueGoal[], id: string): RevenueGoal[] {
  return goals.filter((g) => g.id !== id)
}

export function newGoal(month: string): RevenueGoal {
  return {
    id: `goal-${Date.now()}`,
    month,
    targetRevenue: 1000,
    actualRevenue: 0,
    unitsSold: 0,
    avgOrderValue: 25,
    notes: '',
    createdAt: new Date().toISOString(),
  }
}

export function getCoachingTips(goal: RevenueGoal, proj: GoalProjection): string[] {
  const tips: string[] = []
  const pct = goal.targetRevenue > 0 ? (goal.actualRevenue / goal.targetRevenue) * 100 : 0

  if (pct >= 100) {
    tips.push(`You've hit your goal! Consider raising next month's target by 20–30%.`)
    tips.push(`Analyze which products drove the most sales this month and double down on them.`)
    return tips
  }

  if (proj.onTrack) {
    tips.push(`You're on track. Maintain your current pace of $${proj.currentDailyRate.toFixed(0)}/day.`)
    tips.push(`Consider running a limited-time 10% discount to accelerate sales in the final days.`)
  } else {
    tips.push(`You need $${proj.dailyRateRequired.toFixed(0)}/day for the rest of the month to hit your goal.`)
    if (proj.unitsNeeded > 0) {
      tips.push(`That's roughly ${proj.unitsNeeded} more sale${proj.unitsNeeded > 1 ? 's' : ''} at your average order value of $${goal.avgOrderValue}.`)
    }
    tips.push(`Try pinning your top product on Pinterest and posting a behind-the-scenes Story on Instagram to drive traffic.`)
    if (proj.daysLeft <= 7) {
      tips.push(`With ${proj.daysLeft} days left, consider a flash sale (15–20% off) to urgency-drive purchases.`)
    } else {
      tips.push(`Launch a bundle — combining 2 products at a slight discount can lift your average order value.`)
    }
  }

  if (goal.unitsSold > 0 && goal.avgOrderValue < 20) {
    tips.push(`Your average order value ($${goal.avgOrderValue}) is below $20. Try adding a related upsell in your thank-you message.`)
  }

  return tips
}
