/* global process */
import { MongoClient } from 'mongodb'
import { initializeMongoSchema } from './mongodbSchema.js'

const allowedStatuses = new Set(['confirmed', 'active', 'returned', 'cancelled'])

const seedBikeTypes = [
  { type: 'City bike', total: 8, reserved: 2, rented: 1 },
  { type: 'Electric bike', total: 5, reserved: 1, rented: 2 },
  { type: 'Cargo bike', total: 3, reserved: 1, rented: 0 },
]

const seedReservations = [
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

function createReference(prefix) {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `${prefix}-${timestamp}${random}`
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toApiReservation(document) {
  return {
    id: document.reference,
    customer: document.customerName,
    phone: document.phone,
    bikeType: document.bikeType,
    duration: document.duration,
    time: document.time,
    agreement: document.agreementConfirmed,
    status: document.status,
  }
}

function validateReservationPayload(payload) {
  const requiredFields = ['customer', 'phone', 'bikeType', 'duration']
  const missingField = requiredFields.find(field => !String(payload[field] || '').trim())

  if (missingField) return `${missingField} is required.`
  if (!payload.agreement) return 'agreement must be confirmed.'

  return ''
}

export class MemoryStore {
  name = 'memory'

  constructor() {
    this.bikeTypes = [...seedBikeTypes]
    this.reservations = [...seedReservations]
  }

  async initialize() {}

  async getReservations(search = '') {
    const term = search.trim().toLowerCase()
    if (!term) return this.reservations

    return this.reservations.filter(reservation => (
      reservation.customer.toLowerCase().includes(term)
      || reservation.phone.includes(term)
      || reservation.id.toLowerCase().includes(term)
      || reservation.bikeType.toLowerCase().includes(term)
    ))
  }

  async createReservation(payload, status = 'confirmed') {
    const error = validateReservationPayload(payload)
    if (error) return { error }

    const reservation = {
      id: createReference(status === 'active' ? 'WI' : 'BR'),
      customer: payload.customer.trim(),
      phone: payload.phone.trim(),
      bikeType: payload.bikeType,
      duration: payload.duration,
      time: payload.time || (status === 'active' ? 'Walk-in' : 'Online'),
      agreement: Boolean(payload.agreement),
      status,
    }

    this.reservations = [reservation, ...this.reservations]
    return { reservation }
  }

  async updateReservationStatus(id, status) {
    if (!allowedStatuses.has(status)) return { error: 'Invalid reservation status.', statusCode: 400 }

    const index = this.reservations.findIndex(reservation => reservation.id === id)
    if (index === -1) return { error: 'Reservation not found.', statusCode: 404 }

    this.reservations[index] = { ...this.reservations[index], status }
    return { reservation: this.reservations[index] }
  }

  async getAvailability() {
    return this.bikeTypes.map(bike => {
      const reserved = this.reservations.filter(reservation => reservation.bikeType === bike.type && reservation.status === 'confirmed').length
      const rented = this.reservations.filter(reservation => reservation.bikeType === bike.type && reservation.status === 'active').length

      return {
        ...bike,
        reserved,
        rented,
        available: Math.max(bike.total - reserved - rented, 0),
      }
    })
  }
}

export class MongoStore {
  name = 'mongodb'

  constructor({ uri, databaseName }) {
    this.client = new MongoClient(uri)
    this.databaseName = databaseName
  }

  async initialize() {
    await this.client.connect()
    this.db = this.client.db(this.databaseName)
    await initializeMongoSchema(this.db)
    await this.seedDefaults()
  }

  async seedDefaults() {
    const now = new Date()

    for (const bikeType of seedBikeTypes) {
      await this.db.collection('bikeTypes').updateOne(
        { type: bikeType.type },
        { $setOnInsert: { type: bikeType.type, createdAt: now } },
        { upsert: true },
      )
    }

    const existingBikeCount = await this.db.collection('bikes').countDocuments()
    if (existingBikeCount === 0) {
      const bikes = seedBikeTypes.flatMap(bikeType => (
        Array.from({ length: bikeType.total }, (_, index) => ({
          bikeCode: `${bikeType.type.split(' ')[0].toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
          bikeType: bikeType.type,
          status: 'available',
          createdAt: now,
        }))
      ))
      await this.db.collection('bikes').insertMany(bikes)
    }

    for (const reservation of seedReservations) {
      await this.db.collection('reservations').updateOne(
        { reference: reservation.id },
        {
          $setOnInsert: {
            reference: reservation.id,
            customerName: reservation.customer,
            phone: reservation.phone,
            bikeType: reservation.bikeType,
            duration: reservation.duration,
            time: reservation.time,
            agreementConfirmed: reservation.agreement,
            status: reservation.status,
            createdAt: now,
          },
        },
        { upsert: true },
      )
    }
  }

  async getReservations(search = '') {
    const term = escapeRegex(search.trim())
    const filter = term
      ? {
          $or: [
            { customerName: { $regex: term, $options: 'i' } },
            { phone: { $regex: term, $options: 'i' } },
            { reference: { $regex: term, $options: 'i' } },
            { bikeType: { $regex: term, $options: 'i' } },
          ],
        }
      : {}

    const documents = await this.db.collection('reservations')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    return documents.map(toApiReservation)
  }

  async createReservation(payload, status = 'confirmed') {
    const error = validateReservationPayload(payload)
    if (error) return { error }

    const now = new Date()
    const document = {
      reference: createReference(status === 'active' ? 'WI' : 'BR'),
      customerName: payload.customer.trim(),
      phone: payload.phone.trim(),
      bikeType: payload.bikeType,
      duration: payload.duration,
      groupMember: payload.groupMember || '',
      time: payload.time || (status === 'active' ? 'Walk-in' : 'Online'),
      agreementConfirmed: Boolean(payload.agreement),
      status,
      createdAt: now,
      updatedAt: now,
    }

    await this.db.collection('reservations').insertOne(document)
    await this.db.collection('customers').updateOne(
      { phone: document.phone },
      {
        $set: { name: document.customerName, updatedAt: now },
        $setOnInsert: { phone: document.phone, createdAt: now },
      },
      { upsert: true },
    )
    await this.db.collection('agreements').updateOne(
      { reservationReference: document.reference },
      { $set: { confirmed: document.agreementConfirmed, confirmedAt: now } },
      { upsert: true },
    )

    return { reservation: toApiReservation(document) }
  }

  async updateReservationStatus(id, status) {
    if (!allowedStatuses.has(status)) return { error: 'Invalid reservation status.', statusCode: 400 }

    const result = await this.db.collection('reservations').findOneAndUpdate(
      { reference: id },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' },
    )

    if (!result) return { error: 'Reservation not found.', statusCode: 404 }

    return { reservation: toApiReservation(result) }
  }

  async getAvailability() {
    const bikeTypes = await this.db.collection('bikeTypes').find().sort({ type: 1 }).toArray()
    const bikes = await this.db.collection('bikes').aggregate([
      { $group: { _id: '$bikeType', total: { $sum: 1 } } },
    ]).toArray()
    const reservationCounts = await this.db.collection('reservations').aggregate([
      { $match: { status: { $in: ['confirmed', 'active'] } } },
      { $group: { _id: { bikeType: '$bikeType', status: '$status' }, count: { $sum: 1 } } },
    ]).toArray()

    return bikeTypes.map(bikeType => {
      const total = bikes.find(bike => bike._id === bikeType.type)?.total || 0
      const reserved = reservationCounts.find(count => count._id.bikeType === bikeType.type && count._id.status === 'confirmed')?.count || 0
      const rented = reservationCounts.find(count => count._id.bikeType === bikeType.type && count._id.status === 'active')?.count || 0

      return {
        type: bikeType.type,
        total,
        reserved,
        rented,
        available: Math.max(total - reserved - rented, 0),
      }
    })
  }
}

export async function createStore() {
  const uri = process.env.MONGODB_URI
  const databaseName = process.env.MONGODB_DATABASE || 'bike_rental'
  const store = uri ? new MongoStore({ uri, databaseName }) : new MemoryStore()
  await store.initialize()
  return store
}
