/* global process */
import { Buffer } from 'node:buffer'
import { createServer } from 'node:http'
import { randomUUID, timingSafeEqual } from 'node:crypto'
import { createStore } from './database.js'

const PORT = Number(process.env.PORT || 3001)
const STAFF_EMAIL = process.env.STAFF_EMAIL || 'staff@bikerental.local'
const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'staff123'
const STAFF_SESSION_TTL_MS = 1000 * 60 * 60 * 8
const staffSessions = new Map()

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

function safeCompare(value, expected) {
  const valueBuffer = Buffer.from(String(value || ''))
  const expectedBuffer = Buffer.from(String(expected || ''))

  if (valueBuffer.length !== expectedBuffer.length) return false
  return timingSafeEqual(valueBuffer, expectedBuffer)
}

function createStaffSession() {
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + STAFF_SESSION_TTL_MS).toISOString()
  const session = {
    email: STAFF_EMAIL,
    expiresAt,
    name: 'Staff Clerk',
    role: 'clerk',
    token,
  }

  staffSessions.set(token, session)
  return session
}

function getBearerToken(request) {
  const header = request.headers.authorization || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1] || ''
}

function requireStaff(request, response) {
  const token = getBearerToken(request)
  const session = token ? staffSessions.get(token) : null

  if (!session) {
    sendJson(response, 401, { error: 'Staff sign-in required.' })
    return null
  }

  if (Date.parse(session.expiresAt) <= Date.now()) {
    staffSessions.delete(token)
    sendJson(response, 401, { error: 'Staff session expired. Please sign in again.' })
    return null
  }

  return session
}

function createRequestHandler(store) {
  return async function handleRequest(request, response) {
    const url = new URL(request.url, `http://${request.headers.host}`)

    if (request.method === 'OPTIONS') {
      sendJson(response, 204, {})
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, { ok: true, database: store.name, service: 'bike-rental-api' })
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      try {
        const payload = await readBody(request)
        const emailMatches = safeCompare(payload.email, STAFF_EMAIL)
        const passwordMatches = safeCompare(payload.password, STAFF_PASSWORD)

        if (!emailMatches || !passwordMatches) {
          sendJson(response, 401, { error: 'Invalid staff email or password.' })
          return
        }

        sendJson(response, 200, { session: createStaffSession() })
      } catch {
        sendJson(response, 400, { error: 'Invalid JSON body.' })
      }
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/session') {
      const session = requireStaff(request, response)
      if (!session) return
      sendJson(response, 200, { session })
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      const token = getBearerToken(request)
      if (token) staffSessions.delete(token)
      sendJson(response, 200, { ok: true })
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/reservations') {
      if (!requireStaff(request, response)) return
      const search = url.searchParams.get('search') || ''
      const reservations = await store.getReservations(search)
      sendJson(response, 200, { reservations })
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/reservations') {
      try {
        const payload = await readBody(request)
        const result = await store.createReservation(payload, 'confirmed')

        if (result.error) {
          sendJson(response, result.statusCode || 400, { error: result.error })
          return
        }

        sendJson(response, 201, { reservation: result.reservation })
      } catch {
        sendJson(response, 400, { error: 'Invalid JSON body.' })
      }
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/walk-ins') {
      if (!requireStaff(request, response)) return
      try {
        const payload = await readBody(request)
        const result = await store.createReservation(payload, 'active')

        if (result.error) {
          sendJson(response, result.statusCode || 400, { error: result.error })
          return
        }

        sendJson(response, 201, { reservation: result.reservation })
      } catch {
        sendJson(response, 400, { error: 'Invalid JSON body.' })
      }
      return
    }

    const statusMatch = url.pathname.match(/^\/api\/reservations\/([^/]+)\/status$/)
    if (request.method === 'PATCH' && statusMatch) {
      if (!requireStaff(request, response)) return
      try {
        const payload = await readBody(request)
        const result = await store.updateReservationStatus(statusMatch[1], payload.status)

        if (result.error) {
          sendJson(response, result.statusCode || 400, { error: result.error })
          return
        }

        sendJson(response, 200, { reservation: result.reservation })
      } catch {
        sendJson(response, 400, { error: 'Invalid JSON body.' })
      }
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/bikes/availability') {
      const availability = await store.getAvailability()
      sendJson(response, 200, { availability })
      return
    }

    sendJson(response, 404, { error: 'Route not found.' })
  }
}

const store = await createStore()
const handler = createRequestHandler(store)

createServer((request, response) => {
  handler(request, response).catch(error => {
    console.error(error)
    sendJson(response, 500, { error: 'Internal server error.' })
  })
}).listen(PORT, () => {
  console.log(`Bike rental API listening on http://localhost:${PORT} using ${store.name}`)
})
