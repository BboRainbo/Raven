// utils/historyManager.ts
export interface HistoryState<T> {
  history: T[]
  index: number
  limit: number
}

export function createHistory<T>(initial: T, limit = 10): HistoryState<T> {
  return { history: [initial], index: 0, limit }
}

export function pushHistory<T>(state: HistoryState<T>, newItem: T): HistoryState<T> {
  const newHistory = state.history.slice(0, state.index + 1)
  newHistory.push(structuredClone(newItem))
  if (newHistory.length > state.limit) newHistory.shift()
  return { ...state, history: newHistory, index: newHistory.length - 1 }
}

export function undo<T>(state: HistoryState<T>): HistoryState<T> {
  if (state.index > 0) {
    return { ...state, index: state.index - 1 }
  }
  return state
}

export function redo<T>(state: HistoryState<T>): HistoryState<T> {
  if (state.index < state.history.length - 1) {
    return { ...state, index: state.index + 1 }
  }
  return state
}

export function current<T>(state: HistoryState<T>): T {
  return state.history[state.index]
}
