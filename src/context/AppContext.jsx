import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import storage from '../services/storage.js'
import { DEFAULT_SETTINGS, DEFAULT_HABITS, DEFAULT_BUDGETS, DEFAULT_GOALS } from '../data/defaults.js'

const AppContext = createContext(null)

// ── Initial State ────────────────────────────────────────────────
function loadInitialState() {
  const storedSettings = storage.get('settings') || {}
  const settings = { ...DEFAULT_SETTINGS, ...storedSettings, notifications: { ...DEFAULT_SETTINGS.notifications, ...(storedSettings.notifications || {}) }, prayerTimes: { ...DEFAULT_SETTINGS.prayerTimes, ...(storedSettings.prayerTimes || {}) } }
  const habits = storage.get('habits') || DEFAULT_HABITS
  const habitLogs = storage.get('habitLogs') || {}
  const prayers = storage.get('prayers') || {}
  const studySessions = storage.get('studySessions') || []
  const studyScheduled = storage.get('studyScheduled') || []
  const gymLogs = storage.get('gymLogs') || {}
  const waterLogs = storage.get('waterLogs') || {}
  const selfCare = storage.get('selfCare') || {}
  const transactions = storage.get('transactions') || []
  const budgets = storage.get('budgets') || DEFAULT_BUDGETS
  const goals = storage.get('goals') || DEFAULT_GOALS
  const calendarEvents = storage.get('calendarEvents') || []
  const loans = storage.get('loans') || []

  return { settings, habits, habitLogs, prayers, studySessions, studyScheduled, gymLogs, waterLogs, selfCare, transactions, budgets, goals, calendarEvents, loans }
}

// ── Reducer ──────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    // Settings
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }

    // Habits
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] }
    case 'UPDATE_HABIT':
      return { ...state, habits: state.habits.map(h => h.id === action.payload.id ? { ...h, ...action.payload } : h) }
    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter(h => h.id !== action.payload) }
    case 'TOGGLE_HABIT_LOG': {
      const { date, habitId, status } = action.payload
      return {
        ...state,
        habitLogs: {
          ...state.habitLogs,
          [date]: { ...(state.habitLogs[date] || {}), [habitId]: status },
        },
      }
    }

    // Prayers
    case 'UPDATE_PRAYER': {
      const { date, prayerId, status } = action.payload
      return {
        ...state,
        prayers: {
          ...state.prayers,
          [date]: { ...(state.prayers[date] || {}), [prayerId]: status },
        },
      }
    }

    // Study
    case 'ADD_STUDY_SESSION':
      return { ...state, studySessions: [...state.studySessions, action.payload] }
    case 'UPDATE_STUDY_SESSION':
      return { ...state, studySessions: state.studySessions.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s) }
    case 'DELETE_STUDY_SESSION':
      return { ...state, studySessions: state.studySessions.filter(s => s.id !== action.payload) }

    // Study Scheduled
    case 'ADD_STUDY_SCHEDULE':
      return { ...state, studyScheduled: [...state.studyScheduled, action.payload] }
    case 'UPDATE_STUDY_SCHEDULE':
      return { ...state, studyScheduled: state.studyScheduled.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s) }
    case 'DELETE_STUDY_SCHEDULE':
      return { ...state, studyScheduled: state.studyScheduled.filter(s => s.id !== action.payload) }

    // Gym
    case 'UPDATE_GYM_LOG': {
      const { date, data } = action.payload
      return {
        ...state,
        gymLogs: { ...state.gymLogs, [date]: { ...(state.gymLogs[date] || {}), ...data } },
      }
    }

    // Water
    case 'SET_WATER': {
      const { date, amount } = action.payload
      return { ...state, waterLogs: { ...state.waterLogs, [date]: amount } }
    }
    case 'ADD_WATER': {
      const { date, amount } = action.payload
      const current = state.waterLogs[date] || 0
      return { ...state, waterLogs: { ...state.waterLogs, [date]: current + amount } }
    }

    // Self Care
    case 'TOGGLE_SELF_CARE': {
      const { date, itemId } = action.payload
      const current = state.selfCare[date] || {}
      return {
        ...state,
        selfCare: { ...state.selfCare, [date]: { ...current, [itemId]: !current[itemId] } },
      }
    }

    // Finance
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] }
    case 'UPDATE_TRANSACTION':
      return { ...state, transactions: state.transactions.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) }
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) }

    // Calendar reminders / events
    case 'ADD_CALENDAR_EVENT':
      return { ...state, calendarEvents: [...state.calendarEvents, action.payload] }
    case 'UPDATE_CALENDAR_EVENT':
      return { ...state, calendarEvents: state.calendarEvents.map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e) }
    case 'DELETE_CALENDAR_EVENT':
      return { ...state, calendarEvents: state.calendarEvents.filter(e => e.id !== action.payload) }

    // Borrow / lend tracking
    case 'ADD_LOAN':
      return { ...state, loans: [...state.loans, action.payload] }
    case 'UPDATE_LOAN':
      return { ...state, loans: state.loans.map(l => l.id === action.payload.id ? { ...l, ...action.payload } : l) }
    case 'DELETE_LOAN':
      return { ...state, loans: state.loans.filter(l => l.id !== action.payload) }

    // Budgets
    case 'SET_BUDGET': {
      const exists = state.budgets.find(b => b.category === action.payload.category)
      if (exists) {
        return { ...state, budgets: state.budgets.map(b => b.category === action.payload.category ? { ...b, amount: action.payload.amount } : b) }
      }
      return { ...state, budgets: [...state.budgets, action.payload] }
    }
    case 'DELETE_BUDGET':
      return { ...state, budgets: state.budgets.filter(b => b.id !== action.payload) }

    // Goals
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] }
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? { ...g, ...action.payload } : g) }
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.payload) }

    // Seed / Reset
    case 'HYDRATE_STATE':
      return { ...state, ...action.payload }
    case 'RESET_ALL':
      return loadInitialState()

    default:
      return state
  }
}

// ── Provider ─────────────────────────────────────────────────────
export function AppProvider({ children, isAuthenticated }) {
  const [state, dispatch] = useReducer(reducer, null, loadInitialState)
  const [hydrated, setHydrated] = React.useState(false)

  // Persist locally and sync to MongoDB whenever state changes (after hydration)
  useEffect(() => {
    if (!hydrated) return
    storage.persistState(state)
  }, [state, hydrated])

  // Load cloud data whenever the user becomes authenticated
  useEffect(() => {
    if (!isAuthenticated) return

    let active = true
    setHydrated(false)

    // Clear local state first, then load from cloud
    storage.loadRemoteState().then(remoteState => {
      if (!active) return
      if (remoteState) {
        dispatch({ type: 'HYDRATE_STATE', payload: remoteState })
        // Also write to localStorage so it's available offline
        storage.persistState(remoteState)
      }
      setHydrated(true)
    }).catch(() => {
      if (active) setHydrated(true)
    })

    return () => { active = false }
  }, [isAuthenticated])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
