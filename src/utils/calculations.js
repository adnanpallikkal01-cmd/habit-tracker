import { toDateStr, pastDays, getWeekDates, daysInMonth, currentMonth } from './dateHelpers.js'

// ────────────────────────────────────────────────────────────────
// Calculations — all pure functions, no side effects
// ────────────────────────────────────────────────────────────────

// ── Prayer ──────────────────────────────────────────────────────

/** Returns {completed, total, percentage} for prayers on a date */
export function getPrayerStats(prayers, dateStr) {
  const day = prayers[dateStr] || {}
  const total = 5
  const completed = Object.values(day).filter(v => v === 'completed').length
  return { completed, total, percentage: Math.round((completed / total) * 100) }
}

/** Returns prayer streak: consecutive days with all 5 prayers completed */
export function getPrayerStreak(prayers) {
  let streak = 0
  let best = 0
  const today = toDateStr()
  let current = 0

  const days = pastDays(365).reverse()
  for (const d of days) {
    const { completed } = getPrayerStats(prayers, d)
    if (completed === 5) {
      current++
      if (current > best) best = current
    } else {
      current = 0
    }
  }

  // Current streak = consecutive from today backward
  streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = toDateStr(d)
    const { completed } = getPrayerStats(prayers, ds)
    if (completed === 5) streak++
    else break
  }

  return { current: streak, best }
}

/** Monthly prayer completion rate */
export function getMonthlyPrayerRate(prayers, yearMonth = currentMonth()) {
  const days = daysInMonth(yearMonth)
  let totalPrayers = 0
  let completedPrayers = 0
  days.forEach(d => {
    const s = getPrayerStats(prayers, d)
    totalPrayers += s.total
    completedPrayers += s.completed
  })
  return totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0
}

// ── Habits ──────────────────────────────────────────────────────

/** Completion % for a set of habits on a date */
export function getDayHabitCompletion(habitLogs, habits, dateStr) {
  if (!habits.length) return 0
  const log = habitLogs[dateStr] || {}
  const active = habits.filter(h => h.active)
  if (!active.length) return 0
  const done = active.filter(h => log[h.id] === 'completed').length
  return Math.round((done / active.length) * 100)
}

/** Habit streak for a single habit */
export function getHabitStreak(habitLogs, habitId) {
  let current = 0
  let best = 0
  let run = 0

  const days = pastDays(365)
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i]
    const log = habitLogs[d] || {}
    if (log[habitId] === 'completed') {
      run++
      if (run > best) best = run
    } else {
      run = 0
    }
  }

  // Current (from today backwards)
  for (let i = 0; i < 365; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = toDateStr(d)
    const log = habitLogs[ds] || {}
    if (log[habitId] === 'completed') current++
    else break
  }

  return { current, best }
}

/** Weekly habit completion (this week's days avg) */
export function getWeeklyHabitCompletion(habitLogs, habits) {
  const week = getWeekDates()
  const rates = week.map(d => getDayHabitCompletion(habitLogs, habits, d))
  const total = rates.reduce((a, b) => a + b, 0)
  return Math.round(total / week.length)
}

// ── Study ────────────────────────────────────────────────────────

/** Total study minutes for a date */
export function getStudyMinutes(studySessions, dateStr) {
  return studySessions
    .filter(s => s.date === dateStr)
    .reduce((sum, s) => sum + (s.durationMins || 0), 0)
}

/** Study minutes for a range of dates */
export function getStudyMinutesRange(studySessions, dates) {
  return dates.reduce((sum, d) => sum + getStudyMinutes(studySessions, d), 0)
}

/** Study streak: consecutive days with >0 study */
export function getStudyStreak(studySessions) {
  let current = 0
  let best = 0
  let run = 0
  const days = pastDays(365)

  for (let i = days.length - 1; i >= 0; i--) {
    const mins = getStudyMinutes(studySessions, days[i])
    if (mins > 0) { run++; if (run > best) best = run }
    else run = 0
  }

  for (let i = 0; i < 365; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = toDateStr(d)
    if (getStudyMinutes(studySessions, ds) > 0) current++
    else break
  }
  return { current, best }
}

// ── Gym / Fitness ────────────────────────────────────────────────

/** Number of gym sessions in a date range */
export function getGymCount(gymLogs, dates) {
  return dates.filter(d => gymLogs[d]?.done).length
}

/** Gym streak */
export function getGymStreak(gymLogs) {
  let current = 0
  let best = 0
  let run = 0
  const days = pastDays(365)

  for (let i = days.length - 1; i >= 0; i--) {
    if (gymLogs[days[i]]?.done) { run++; if (run > best) best = run }
    else run = 0
  }

  for (let i = 0; i < 365; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = toDateStr(d)
    if (gymLogs[ds]?.done) current++
    else break
  }
  return { current, best }
}

// ── Water ────────────────────────────────────────────────────────

/** Water intake for a date in ml */
export function getWaterMl(waterLogs, dateStr) {
  return waterLogs[dateStr] || 0
}

/** Water streak: consecutive days at/above target */
export function getWaterStreak(waterLogs, targetMl) {
  let current = 0
  let best = 0
  let run = 0
  const days = pastDays(365)

  for (let i = days.length - 1; i >= 0; i--) {
    if ((waterLogs[days[i]] || 0) >= targetMl) { run++; if (run > best) best = run }
    else run = 0
  }

  for (let i = 0; i < 365; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = toDateStr(d)
    if ((waterLogs[ds] || 0) >= targetMl) current++
    else break
  }
  return { current, best }
}

// ── Finance ──────────────────────────────────────────────────────

/** Totals from transactions filtered by date range and type */
export function getFinanceTotals(transactions, startDate, endDate) {
  const filtered = transactions.filter(t => t.date >= startDate && t.date <= endDate)
  const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const savings = income - expenses
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0
  return { income, expenses, savings, savingsRate }
}

/** Category breakdown for expenses */
export function getExpensesByCategory(transactions, startDate, endDate) {
  const filtered = transactions.filter(t =>
    t.type === 'expense' && t.date >= startDate && t.date <= endDate
  )
  const map = {}
  filtered.forEach(t => {
    map[t.category] = (map[t.category] || 0) + t.amount
  })
  return map
}

/** Budget status: spent vs limit per category */
export function getBudgetStatus(budgets, transactions, yearMonth = currentMonth()) {
  const start = `${yearMonth}-01`
  const end = `${yearMonth}-31`
  const expMap = getExpensesByCategory(transactions, start, end)
  return budgets.map(b => ({
    ...b,
    spent: expMap[b.category] || 0,
    remaining: b.amount - (expMap[b.category] || 0),
    overBudget: (expMap[b.category] || 0) > b.amount,
    percentage: b.amount > 0 ? Math.min(100, Math.round(((expMap[b.category] || 0) / b.amount) * 100)) : 0,
  }))
}

// ── Daily Score ──────────────────────────────────────────────────

/**
 * Calculates the daily personal score (0-100)
 * Weights: prayer 20, study 20, health 20, fitness 15, habits 15, finance 10
 */
export function getDailyScore(dateStr, { prayers, studySessions, gymLogs, waterLogs, habitLogs, habits, settings, selfCare }) {
  const weights = settings?.scoreWeights || {
    prayer: 20, study: 20, health: 20, fitness: 15, habits: 15, finance: 10
  }

  const prayerStats = getPrayerStats(prayers, dateStr)
  const studyMins = getStudyMinutes(studySessions, dateStr)
  const waterMl = getWaterMl(waterLogs, dateStr)
  const sc = selfCare[dateStr] || {}
  const selfCareItems = Object.values(sc)
  const habitScore = getDayHabitCompletion(habitLogs, habits, dateStr)
  const gymScore = gymLogs[dateStr]?.done ? 100 : 0
  const hasMeaningfulData = (
    prayerStats.completed > 0 ||
    studyMins > 0 ||
    waterMl > 0 ||
    selfCareItems.length > 0 ||
    gymScore > 0 ||
    habitScore > 0 ||
    (habits || []).some(h => (habitLogs[dateStr] || {})[h.id] !== undefined)
  )

  if (!hasMeaningfulData) return 0

  // Prayer score (0-100)
  const prayerScore = (prayerStats.completed / 5) * 100

  // Study score (vs daily target)
  const studyTarget = (settings?.dailyStudyTarget || 4) * 60  // to minutes
  const studyScore = Math.min(100, (studyMins / studyTarget) * 100)

  // Health score: water + self care
  const waterTarget = settings?.dailyWaterTarget || 3000
  const waterScore = Math.min(100, (waterMl / waterTarget) * 100)
  const selfCareScore = selfCareItems.length > 0
    ? (selfCareItems.filter(Boolean).length / selfCareItems.length) * 100
    : 0
  const healthScore = (waterScore + selfCareScore) / 2

  // Finance score is effectively neutral unless there is actual finance activity logged.
  const financeScore = 100

  const total = (
    (prayerScore * weights.prayer) +
    (studyScore * weights.study) +
    (healthScore * weights.health) +
    (gymScore * weights.fitness) +
    (habitScore * weights.habits) +
    (financeScore * weights.finance)
  ) / 100

  return Math.round(Math.min(100, total))
}

// ── Overall Streak ───────────────────────────────────────────────

/** Overall streak: consecutive days with daily score >= 50 */
export function getOverallStreak(dateStr, stateRef) {
  let current = 0
  let best = 0
  let run = 0
  const days = pastDays(90)

  for (let i = days.length - 1; i >= 0; i--) {
    const score = getDailyScore(days[i], stateRef)
    if (score >= 50) { run++; if (run > best) best = run }
    else run = 0
  }

  for (let i = 0; i < 90; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = toDateStr(d)
    const score = getDailyScore(ds, stateRef)
    if (score >= 50) current++
    else break
  }
  return { current, best }
}

// ── Growth Scores ─────────────────────────────────────────────

/** Personal growth area scores based on recent 30 days */
export function getGrowthScores({ prayers, studySessions, gymLogs, waterLogs, habitLogs, habits, selfCare, settings }) {
  const days = pastDays(30)

  // Discipline: habit completion + wakeup habit
  const disciplineAvg = days.reduce((s, d) =>
    s + getDayHabitCompletion(habitLogs, habits, d), 0) / days.length

  // Knowledge: study hours
  const studyTarget = (settings?.dailyStudyTarget || 4) * 60
  const studyAvg = days.reduce((s, d) =>
    s + Math.min(100, (getStudyMinutes(studySessions, d) / studyTarget) * 100), 0) / days.length

  // Health: water + self care
  const waterTarget = settings?.dailyWaterTarget || 3000
  const healthAvg = days.reduce((s, d) => {
    const wScore = Math.min(100, (getWaterMl(waterLogs, d) / waterTarget) * 100)
    const sc = selfCare[d] || {}
    const scItems = Object.values(sc)
    const scScore = scItems.length ? (scItems.filter(Boolean).length / scItems.length) * 100 : 50
    return s + (wScore + scScore) / 2
  }, 0) / days.length

  // Fitness: gym attendance
  const fitnessAvg = (getGymCount(gymLogs, days) / days.length) * 100

  // Spiritual: prayer consistency
  const spiritualAvg = days.reduce((s, d) =>
    s + getPrayerStats(prayers, d).percentage, 0) / days.length

  // Finance: simplified
  const financeAvg = 72  // base

  const scores = {
    discipline: Math.round(disciplineAvg),
    knowledge: Math.round(studyAvg),
    health: Math.round(healthAvg),
    fitness: Math.round(Math.min(100, fitnessAvg)),
    spiritual: Math.round(spiritualAvg),
    finance: financeAvg,
  }

  const overall = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
  )

  return { ...scores, overall }
}
