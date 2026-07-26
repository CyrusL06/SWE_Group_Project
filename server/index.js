/* global process */
import { createServer } from 'node:http'
import { createStore } from './database.js'

const PORT = Number(process.env.PORT || 3001)

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

    if (request.method === 'GET' && url.pathname === '/api/reservations') {
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
