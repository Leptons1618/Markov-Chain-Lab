/**
 * Authentication utilities and types
 */

export interface User {
  id: string
  email?: string
  name?: string
  avatar_url?: string
}

export interface AuthState {
  user: User | null
  isGuest: boolean
  loading: boolean
}

/**
 * Check if user is in guest mode
 */
export function isGuestMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('markov-guest-mode') === 'true'
}

/**
 * Set guest mode
 */
export function setGuestMode(enabled: boolean): void {
  if (typeof window === 'undefined') return
  if (enabled) {
    localStorage.setItem('markov-guest-mode', 'true')
  } else {
    localStorage.removeItem('markov-guest-mode')
  }
}

/**
 * Get guest mode warning message
 */
export function getGuestModeWarning(): string {
  return "You're in guest mode. Your progress and achievements are stored locally and may be lost if you clear your browser data. Sign in to save your progress across devices."
}
