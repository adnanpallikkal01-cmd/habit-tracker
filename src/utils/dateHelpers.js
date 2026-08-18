// ────────────────────────────────────────────────────────────────
// Date Helpers
// ────────────────────────────────────────────────────────────────

/** Returns "YYYY-MM-DD" for a given Date (or today) */
export const toDateStr = (date = new Date()) => {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

/** Returns a Date object from "YYYY-MM-DD" string */
export const fromDateStr = (str) => {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Returns array of "YYYY-MM-DD" strings for the past N days (inclusive today) */
export const pastDays = (n) => {
  const result = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    result.push(toDateStr(d))
  }
  return result
}

/** Returns array of "YYYY-MM-DD" for all days in a given month (YYYY-MM) */
export const daysInMonth = (yearMonth) => {
  const [y, m] = yearMonth.split('-').map(Number)
  const count = new Date(y, m, 0).getDate()
  return Array.from({ length: count }, (_, i) =>
    `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
  )
}

/** Returns current month string "YYYY-MM" */
export const currentMonth = () => toDateStr().slice(0, 7)

/** Formats a date string for display: "Monday, August 17, 2026" */
export const formatDateFull = (dateStr) => {
  const d = fromDateStr(dateStr)
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Short format: "Aug 17" */
export const formatDateShort = (dateStr) => {
  const d = fromDateStr(dateStr)
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

/** Returns "This Week", "This Month" etc display ranges */
export const getWeekDates = () => {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return toDateStr(d)
  })
}

/** Returns greeting based on hour */
export const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  if (h < 21) return 'Good Evening'
  return 'Good Night'
}

/** Returns start of current week (Monday) */
export const startOfWeek = () => {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((day + 6) % 7))
  return toDateStr(monday)
}

/** Returns start of current month "YYYY-MM-01" */
export const startOfMonth = () => `${currentMonth()}-01`

/** Returns difference in days between two date strings */
export const daysDiff = (a, b) => {
  const da = fromDateStr(a)
  const db = fromDateStr(b)
  return Math.round((db - da) / 86400000)
}

/** Returns a list of month strings "YYYY-MM" for last N months */
export const pastMonths = (n) => {
  const result = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return result
}
