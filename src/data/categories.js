export const FINANCE_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: '🍔', color: '#f59e0b' },
  { id: 'transport', label: 'Transport', icon: '🚗', color: '#3b82f6' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: '#ec4899' },
  { id: 'education', label: 'Education', icon: '📚', color: '#6366f1' },
  { id: 'bills', label: 'Bills & Utilities', icon: '💡', color: '#8b5cf6' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎮', color: '#f97316' },
  { id: 'health', label: 'Health', icon: '🏥', color: '#ef4444' },
  { id: 'gym', label: 'Gym & Fitness', icon: '💪', color: '#22c55e' },
  { id: 'subscriptions', label: 'Subscriptions', icon: '📱', color: '#14b8a6' },
  { id: 'other', label: 'Other', icon: '💰', color: '#94a3b8' },
]

export const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salary', icon: '💼' },
  { id: 'freelance', label: 'Freelance', icon: '💻' },
  { id: 'business', label: 'Business', icon: '🏢' },
  { id: 'investment', label: 'Investment', icon: '📈' },
  { id: 'gift', label: 'Gift', icon: '🎁' },
  { id: 'other', label: 'Other', icon: '💵' },
]

export const PRAYER_NAMES = [
  { id: 'fajr', label: 'Fajr', time: 'Dawn', arabicName: 'الفجر' },
  { id: 'dhuhr', label: 'Dhuhr', time: 'Midday', arabicName: 'الظهر' },
  { id: 'asr', label: 'Asr', time: 'Afternoon', arabicName: 'العصر' },
  { id: 'maghrib', label: 'Maghrib', time: 'Sunset', arabicName: 'المغرب' },
  { id: 'isha', label: 'Isha', time: 'Night', arabicName: 'العشاء' },
]

export const PRAYER_STATUSES = [
  { id: 'completed', label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/40' },
  { id: 'missed', label: 'Missed', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40' },
  { id: 'qadha', label: 'Qadha', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/40' },
  { id: 'pending', label: 'Pending', color: 'text-slate-400', bg: 'bg-slate-500/20 border-slate-500/40' },
]

export const HABIT_CATEGORIES = [
  { id: 'health', label: 'Health', icon: '❤️', color: '#ef4444' },
  { id: 'fitness', label: 'Fitness', icon: '💪', color: '#22c55e' },
  { id: 'study', label: 'Study', icon: '📖', color: '#6366f1' },
  { id: 'spiritual', label: 'Spiritual', icon: '🕌', color: '#a78bfa' },
  { id: 'mindset', label: 'Mindset', icon: '🧠', color: '#3b82f6' },
  { id: 'social', label: 'Social', icon: '👥', color: '#f59e0b' },
  { id: 'finance', label: 'Finance', icon: '💰', color: '#14b8a6' },
  { id: 'hygiene', label: 'Hygiene', icon: '🪥', color: '#ec4899' },
  { id: 'other', label: 'Other', icon: '⭐', color: '#94a3b8' },
]

export const HABIT_FREQUENCIES = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'weekdays', label: 'Weekdays (Mon–Fri)' },
  { id: 'weekends', label: 'Weekends' },
]

export const SELF_CARE_ITEMS = [
  { id: 'bath', label: 'Bath / Shower', icon: '🚿' },
  { id: 'brush', label: 'Brush Teeth', icon: '🦷' },
  { id: 'skincare', label: 'Skincare', icon: '✨' },
  { id: 'haircare', label: 'Hair Care', icon: '💇' },
  { id: 'clothes', label: 'Clean Clothes', icon: '👕' },
  { id: 'roomcleaning', label: 'Room Cleaning', icon: '🧹' },
  { id: 'grooming', label: 'Grooming', icon: '🪒' },
]

export const GOAL_CATEGORIES = [
  { id: 'study', label: 'Study', icon: '📚' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'spiritual', label: 'Spiritual', icon: '🕌' },
  { id: 'career', label: 'Career', icon: '💼' },
  { id: 'personal', label: 'Personal', icon: '⭐' },
  { id: 'health', label: 'Health', icon: '❤️' },
]

export const WORKOUT_TYPES = [
  'Push Day', 'Pull Day', 'Leg Day', 'Full Body', 'Cardio',
  'HIIT', 'Yoga', 'Stretching', 'Sports', 'Other'
]

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'upi', label: 'UPI' },
  { id: 'card', label: 'Card' },
  { id: 'netbanking', label: 'Net Banking' },
]

export const STUDY_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'JavaScript', 'React', 'Node.js', 'MongoDB', 'Python',
  'Data Structures', 'Algorithms', 'English', 'History',
  'Geography', 'Economics', 'Computer Science', 'Other'
]
