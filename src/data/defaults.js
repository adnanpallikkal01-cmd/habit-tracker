export const DEFAULT_SETTINGS = {
  userName: '',
  profileIcon: '👤',
  profileImage: '',
  currency: '₹',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  theme: 'dark',
  weekStart: 'monday',
  dailyWaterTarget: 0,
  dailyStudyTarget: 0,
  monthlyBudget: 0,
  waterReminderEnabled: false,
  waterReminderIntervalMinutes: 15,
  waterReminderNightPauseEnabled: true,
  waterReminderNightStart: '22:00',
  waterReminderNightEnd: '06:00',
  scoreWeights: {
    prayer: 20,
    study: 20,
    health: 20,
    fitness: 15,
    habits: 15,
    finance: 10,
  },
  notifications: {
    prayer: false,
    study: false,
    gym: false,
    water: false,
    habits: false,
    sleep: false,
    expense: false,
  },
  prayerTimes: {
    fajr: '',
    dhuhr: '',
    asr: '',
    maghrib: '',
    isha: '',
  },
}

export const DEFAULT_HABITS = []
export const DEFAULT_BUDGETS = []
export const DEFAULT_GOALS = []
