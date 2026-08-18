export const DEFAULT_SETTINGS = {
  userName: '',
  profileIcon: '👤',
  profileImage: '',
  currency: '₹',
  theme: 'dark',
  weekStart: 'monday',
  dailyWaterTarget: 3000,
  dailyStudyTarget: 4,
  monthlyBudget: 0,
  waterReminderEnabled: false,
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
