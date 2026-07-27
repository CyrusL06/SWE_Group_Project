import { clearStaffSession, getStaffToken } from './auth'

function authHeaders() {
  const token = getStaffToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401) clearStaffSession()
    throw new Error(payload.error || 'Request failed.')
  }

  return payload
}

export function getReservations(search = '') {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
  return requestJson(`/api/reservations${query}`, { headers: authHeaders() })
}

export function loginStaff(credentials) {
  return requestJson('/api/auth/login', {
    body: JSON.stringify(credentials),
    method: 'POST',
  })
}

export function getStaffSessionStatus() {
  return requestJson('/api/auth/session', { headers: authHeaders() })
}

export function logoutStaff() {
  return requestJson('/api/auth/logout', {
    headers: authHeaders(),
    method: 'POST',
  })
}

export function createReservation(payload) {
  return requestJson('/api/reservations', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export function createWalkIn(payload) {
  return requestJson('/api/walk-ins', {
    body: JSON.stringify(payload),
    headers: authHeaders(),
    method: 'POST',
  })
}

export function updateReservationStatus(id, status) {
  return requestJson(`/api/reservations/${encodeURIComponent(id)}/status`, {
    body: JSON.stringify({ status }),
    headers: authHeaders(),
    method: 'PATCH',
  })
}

export function getAvailability() {
  return requestJson('/api/bikes/availability')
}
