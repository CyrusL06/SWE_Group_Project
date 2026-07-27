const AUTH_STORAGE_KEY = 'bikeRentalStaffSession'

export function saveStaffSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function getStaffSession() {
  const rawSession = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!rawSession) return null

  try {
    const session = JSON.parse(rawSession)
    if (!session?.token) return null
    return session
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function clearStaffSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function getStaffToken() {
  return getStaffSession()?.token || ''
}
