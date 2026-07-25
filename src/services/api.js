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
    throw new Error(payload.error || 'Request failed.')
  }

  return payload
}

export function getReservations(search = '') {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
  return requestJson(`/api/reservations${query}`)
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
    method: 'POST',
  })
}

export function updateReservationStatus(id, status) {
  return requestJson(`/api/reservations/${encodeURIComponent(id)}/status`, {
    body: JSON.stringify({ status }),
    method: 'PATCH',
  })
}

export function getAvailability() {
  return requestJson('/api/bikes/availability')
}
