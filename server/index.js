/* global process */
import { createServer } from 'node:http'

const PORT = Number(process.env.PORT || 3001)

const bikeTypes = [
  { type: 'City bike', total: 8, reserved: 2, rented: 1 },
  { type: 'Electric bike', total: 5, reserved: 1, rented: 2 },
  { type: 'Cargo bike', total: 3, reserved: 1, rented: 0 },
]

let reservations = [
  {
    id: 'BR-104238',
    customer: 'Jordan Lee',
    phone: '604-555-0184',
    bikeType: 'City bike',
    duration: '2 hours',
    time: '10:00 AM',
    agreement: true,
    status: 'confirmed',
  },
  {
    id: 'BR-104251',
    customer: 'Taylor Morgan',
    phone: '604-555-0132',
    bikeType: 'Electric bike',
    duration: 'Half day',
    time: '11:30 AM',
    agreement: true,
    status: 'active',
  },
]

const allowedStatuses = new Set(['confirmed', 'active', 'returned', 'cancelled'])

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  })
  response.end(JSON.stringify(payload))
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''

    request.on('data', chunk => {
      body += chunk
      if (body.length > 1_000_000) request.destroy()
    })

    request.on('end', () => {
      if (!body) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(body))
      } catch (error) {
        reject(error)
      }
    })
  })
}

function getAvailability() {
  return bikeTypes.map(bike => {
    const reserved = reservations.filter(reservation => reservation.bikeType === bike.type && reservation.status === 'confirmed').length
    const rented = reservations.filter(reservation => reservation.bikeType === bike.type && reservation.status === 'active').length

    return {
      ...bike,
      reserved,
      rented,
      available: Math.max(bike.total - reserved - rented, 0),
    }
  })
}

function createReservation(payload, status = 'confirmed') {
  const requiredFields = ['customer', 'phone', 'bikeType', 'duration']
  const missingField = requiredFields.find(field => !String(payload[field] || '').trim())

  if (missingField) {
    return { error: `${missingField} is required.` }
  }

  if (!payload.agreement) {
    return { error: 'agreement must be confirmed.' }
  }

  return {
    id: `${status === 'active' ? 'WI' : 'BR'}-${Date.now().toString().slice(-6)}`,
    customer: payload.customer.trim(),
    phone: payload.phone.trim(),
    bikeType: payload.bikeType,
    duration: payload.duration,
    time: payload.time || (status === 'active' ? 'Walk-in' : 'Online'),
    agreement: Boolean(payload.agreement),
    status,
  }
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`)

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {})
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, { ok: true, service: 'bike-rental-api' })
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/reservations') {
    const search = (url.searchParams.get('search') || '').trim().toLowerCase()
    const data = search
      ? reservations.filter(reservation => (
        reservation.customer.toLowerCase().includes(search)
        || reservation.phone.includes(search)
        || reservation.id.toLowerCase().includes(search)
        || reservation.bikeType.toLowerCase().includes(search)
      ))
      : reservations

    sendJson(response, 200, { reservations: data })
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/reservations') {
    try {
      const payload = await readBody(request)
      const reservation = createReservation(payload, 'confirmed')

      if (reservation.error) {
        sendJson(response, 400, reservation)
        return
      }

      reservations = [reservation, ...reservations]
      sendJson(response, 201, { reservation })
    } catch {
      sendJson(response, 400, { error: 'Invalid JSON body.' })
    }
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/walk-ins') {
    try {
      const payload = await readBody(request)
      const reservation = createReservation(payload, 'active')

      if (reservation.error) {
        sendJson(response, 400, reservation)
        return
      }

      reservations = [reservation, ...reservations]
      sendJson(response, 201, { reservation })
    } catch {
      sendJson(response, 400, { error: 'Invalid JSON body.' })
    }
    return
  }

  const statusMatch = url.pathname.match(/^\/api\/reservations\/([^/]+)\/status$/)
  if (request.method === 'PATCH' && statusMatch) {
    try {
      const payload = await readBody(request)
      const nextStatus = payload.status

      if (!allowedStatuses.has(nextStatus)) {
        sendJson(response, 400, { error: 'Invalid reservation status.' })
        return
      }

      const index = reservations.findIndex(reservation => reservation.id === statusMatch[1])
      if (index === -1) {
        sendJson(response, 404, { error: 'Reservation not found.' })
        return
      }

      reservations[index] = { ...reservations[index], status: nextStatus }
      sendJson(response, 200, { reservation: reservations[index] })
    } catch {
      sendJson(response, 400, { error: 'Invalid JSON body.' })
    }
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/bikes/availability') {
    sendJson(response, 200, { availability: getAvailability() })
    return
  }

  sendJson(response, 404, { error: 'Route not found.' })
}

createServer(handleRequest).listen(PORT, () => {
  console.log(`Bike rental API listening on http://localhost:${PORT}`)
})
