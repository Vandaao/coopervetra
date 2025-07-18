"use client"

import type { User } from "./auth"

const SESSION_KEY = "coopervetra_session"

export function setSession(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  }
}

export function getSession(): User | null {
  if (typeof window !== "undefined") {
    const session = localStorage.getItem(SESSION_KEY)
    if (session) {
      try {
        return JSON.parse(session)
      } catch {
        return null
      }
    }
  }
  return null
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}

export function isAdmin(): boolean {
  const user = getSession()
  return user?.tipo === "admin"
}
