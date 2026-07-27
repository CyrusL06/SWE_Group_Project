/* global process */
import { MongoClient } from 'mongodb'
import { initializeMongoSchema } from './mongodbSchema.js'

const allowedStatuses = new Set(['confirmed', 'active', 'returned', 'cancelled', 'late', 'early return'])

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
    address: '120 River Market Way',
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
    address: '45 Station Loop',
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

function createBikeCode(bikeType, index) {
  return `${bikeType.split(' ')[0].toUpperCase()}-${String(index + 1).padStart(3, '0')}`
}

function durationToMilliseconds(duration) {
  const durationMap = {
    '1 hour': 60 * 60 * 1000,
    '2 hours': 2 * 60 * 60 * 1000,
    'Half day': 4 * 60 * 60 * 1000,
    'Full day': 8 * 60 * 60 * 1000,
  }

  return durationMap[duration] || durationMap['1 hour']
}

function createExpectedReturnAt(duration, startedAt = new Date()) {
  return new Date(startedAt.getTime() + durationToMilliseconds(duration)).toISOString()
}

function calculateReturnStatus(reservation, actualReturnAt = new Date()) {
  if (!reservation.expectedReturnAt) return 'returned'
  return actualReturnAt.getTime() > Date.parse(reservation.expectedReturnAt) ? 'returned' : 'early return'
}

function normalizeCount(value, fallback = 1) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(Math.max(Math.floor(number), 1), 10)
}

function normalizeSelectionCount(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.min(Math.max(Math.floor(number), 0), 10)
}

function splitBikeCodes(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (!value) return []
  return String(value).split(',').map(code => code.trim()).filter(Boolean)
}

function normalizeBikeSelections(payload) {
  if (payload.bikeSelections && typeof payload.bikeSelections === 'object') {
    return Object.fromEntries(Object.entries(payload.bikeSelections)
      .map(([type, count]) => [type, normalizeSelectionCount(count)])
      .filter(([, count]) => count > 0))
  }

  const bikeType = payload.bikeType
  if (!bikeType) return {}
  return { [bikeType]: normalizeCount(payload.bikeQuantity) }
}

function totalBikeSelections(bikeSelections) {
  return Object.values(bikeSelections || {}).reduce((total, count) => total + normalizeSelectionCount(count), 0)
}

function formatBikeSelections(bikeSelections) {
  return Object.entries(bikeSelections || {}).map(([type, count]) => `${count} ${type}`).join(', ')
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toApiReservation(document) {
  return {
    id: document.reference,
    customer: document.customerName,
    phone: document.phone,
    groupSize: normalizeCount(document.groupSize),
    bikeType: document.bikeType,
    bikeSelections: document.bikeSelections || normalizeBikeSelections(document),
    bikeSelectionSummary: formatBikeSelections(document.bikeSelections || normalizeBikeSelections(document)),
    bikeQuantity: normalizeCount(document.bikeQuantity),
    assignedBikeCode: document.assignedBikeCode || '',
    assignedBikeCodes: splitBikeCodes(document.assignedBikeCode),
    duration: document.duration,
    time: document.time,
    startedAt: document.startedAt || '',
    expectedReturnAt: document.expectedReturnAt || '',
    actualReturnAt: document.actualReturnAt || '',
    agreement: document.agreementConfirmed,
    status: document.status,
  }
}

function validateReservationPayload(payload) {
  const requiredFields = ['customer', 'phone', 'duration']
  const missingField = requiredFields.find(field => !String(payload[field] || '').trim())

  if (missingField) return `${missingField} is required.`
  if (!payload.agreement) return 'agreement must be confirmed.'
  const selectedBikeTotal = totalBikeSelections(normalizeBikeSelections(payload))
  if (selectedBikeTotal < 1) return 'at least one bike is required.'
  if (selectedBikeTotal > normalizeCount(payload.groupSize)) return 'bike quantity cannot exceed group size.'

  return ''
}

function validateStatusTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) return ''

  const allowedTransitions = {
    confirmed: new Set(['active', 'cancelled']),
    active: new Set(['returned', 'cancelled', 'late']),
    late: new Set(['returned', 'cancelled']),
    returned: new Set([]),
    'early return': new Set([]),
    cancelled: new Set([]),
  }

  if (!allowedTransitions[currentStatus]?.has(nextStatus)) {
    return `Cannot change reservation status from ${currentStatus} to ${nextStatus}.`
  }

  return ''
}

export class MemoryStore {
  name = 'memory'

  constructor() {
    this.bikeTypes = seedBikeTypes.map(({ type, total }) => ({ type, total }))
    this.bikes = seedBikeTypes.flatMap(bikeType => (
      Array.from({ length: bikeType.total }, (_, index) => ({
        bikeCode: createBikeCode(bikeType.type, index),
        bikeType: bikeType.type,
        status: 'available',
      }))
    ))
    this.reservations = []

    for (const reservation of seedReservations) {
      const localReservation = {
        id: reservation.id,
        customer: reservation.customer,
        phone: reservation.phone,
        groupSize: normalizeCount(reservation.groupSize),
        bikeType: reservation.bikeType,
        bikeSelections: normalizeBikeSelections(reservation),
        bikeQuantity: normalizeCount(reservation.bikeQuantity),
        assignedBikeCode: '',
        duration: reservation.duration,
        time: reservation.time,
        agreement: reservation.agreement,
        status: reservation.status,
        startedAt: '',
        expectedReturnAt: '',
        actualReturnAt: '',
      }

      if (reservation.status === 'active') {
        const claimedBike = this.claimBike(reservation.bikeType, 'rented')
        localReservation.assignedBikeCode = claimedBike?.bikeCode || ''
      }

      if (reservation.status === 'active') {
        const startedAt = new Date(Date.now() - 30 * 60 * 1000)
        localReservation.startedAt = startedAt.toISOString()
        localReservation.expectedReturnAt = createExpectedReturnAt(reservation.duration, startedAt)
      }

      this.reservations.push(localReservation)
    }
  }

  async initialize() {}

  claimBike(bikeType, status) {
    const bike = this.bikes.find(candidate => candidate.bikeType === bikeType && candidate.status === 'available')
    if (!bike) return null
    bike.status = status
    return bike
  }

  claimBikes(bikeType, quantity, status) {
    const availableBikes = this.bikes.filter(candidate => candidate.bikeType === bikeType && candidate.status === 'available')
    if (availableBikes.length < quantity) return []
    const claimedBikes = availableBikes.slice(0, quantity)
    claimedBikes.forEach(bike => { bike.status = status })
    return claimedBikes
  }

  claimBikeSelections(bikeSelections, status) {
    const claimedBikes = []
    for (const [bikeType, quantity] of Object.entries(bikeSelections)) {
      const claimedForType = this.claimBikes(bikeType, quantity, status)
      if (claimedForType.length < quantity) {
        claimedBikes.forEach(bike => { bike.status = 'available' })
        return []
      }
      claimedBikes.push(...claimedForType)
    }
    return claimedBikes
  }

  updateBikeStatus(bikeCode, status) {
    const bike = this.bikes.find(candidate => candidate.bikeCode === bikeCode)
    if (bike) bike.status = status
  }

  refreshOverdueRentals() {
    const now = Date.now()
    this.reservations = this.reservations.map(reservation => {
      if (reservation.status !== 'active' || !reservation.expectedReturnAt || Date.parse(reservation.expectedReturnAt) >= now) {
        return reservation
      }

      return { ...reservation, status: 'late' }
    })
  }

  async getReservations(search = '') {
    this.refreshOverdueRentals()

    const term = search.trim().toLowerCase()
    if (!term) return this.reservations

    return this.reservations.filter(reservation => (
      reservation.customer.toLowerCase().includes(term)
      || reservation.phone.includes(term)
      || reservation.id.toLowerCase().includes(term)
      || reservation.bikeType.toLowerCase().includes(term)
      || reservation.assignedBikeCode.toLowerCase().includes(term)
    ))
  }

  async createReservation(payload, status = 'confirmed') {
    const error = validateReservationPayload(payload)
    if (error) return { error }

    const bikeSelections = normalizeBikeSelections(payload)
    const bikeQuantity = totalBikeSelections(bikeSelections)
    const groupSize = normalizeCount(payload.groupSize)
    const availability = await this.getAvailability()
    const unavailableType = Object.entries(bikeSelections).find(([type, quantity]) => {
      const requestedBikeType = availability.find(bikeType => bikeType.type === type)
      return !requestedBikeType || requestedBikeType.available < quantity
    })
    if (unavailableType) {
      return { error: 'Requested bike quantity is unavailable.', statusCode: 409 }
    }

    const claimedBikes = status === 'active' ? this.claimBikeSelections(bikeSelections, 'rented') : []
    if (status === 'active' && claimedBikes.length < bikeQuantity) {
      return { error: 'Requested bike quantity is unavailable.', statusCode: 409 }
    }

    const now = new Date()
    const reservation = {
      id: createReference(status === 'active' ? 'WI' : 'BR'),
      customer: payload.customer.trim(),
      phone: payload.phone.trim(),
      groupSize,
      bikeType: Object.keys(bikeSelections)[0] || '',
      bikeSelections,
      bikeQuantity,
      assignedBikeCode: claimedBikes.map(bike => bike.bikeCode).join(', '),
      duration: payload.duration,
      time: payload.time || (status === 'active' ? 'Walk-in' : 'Online'),
      agreement: Boolean(payload.agreement),
      status,
      startedAt: status === 'active' ? now.toISOString() : '',
      expectedReturnAt: status === 'active' ? createExpectedReturnAt(payload.duration, now) : '',
      actualReturnAt: '',
    }

    this.reservations = [reservation, ...this.reservations]
    return { reservation }
  }

  async updateReservationStatus(id, status) {
    if (!allowedStatuses.has(status)) return { error: 'Invalid reservation status.', statusCode: 400 }

    this.refreshOverdueRentals()

    const index = this.reservations.findIndex(reservation => reservation.id === id)
    if (index === -1) return { error: 'Reservation not found.', statusCode: 404 }

    const currentReservation = this.reservations[index]
    const transitionError = validateStatusTransition(currentReservation.status, status)
    if (transitionError) return { error: transitionError, statusCode: 409 }

    const now = new Date()
    const updatedReservation = { ...currentReservation }

    if (currentReservation.status === 'confirmed' && status === 'active') {
      const bikeSelections = currentReservation.bikeSelections || normalizeBikeSelections(currentReservation)
      const bikeQuantity = totalBikeSelections(bikeSelections)
      const claimedBikes = currentReservation.assignedBikeCode
        ? splitBikeCodes(currentReservation.assignedBikeCode).map(code => this.bikes.find(bike => bike.bikeCode === code)).filter(Boolean)
        : this.claimBikeSelections(bikeSelections, 'rented')
      if (claimedBikes.length < bikeQuantity) return { error: 'Requested bike quantity is unavailable.', statusCode: 409 }

      updatedReservation.status = 'active'
      updatedReservation.assignedBikeCode = claimedBikes.map(bike => bike.bikeCode).join(', ')
      updatedReservation.startedAt = now.toISOString()
      updatedReservation.expectedReturnAt = createExpectedReturnAt(currentReservation.duration, now)
      updatedReservation.actualReturnAt = ''
      claimedBikes.forEach(bike => this.updateBikeStatus(bike.bikeCode, 'rented'))
    } else if ((currentReservation.status === 'active' || currentReservation.status === 'late') && status === 'returned') {
      updatedReservation.actualReturnAt = now.toISOString()
      updatedReservation.status = calculateReturnStatus(currentReservation, now)
      splitBikeCodes(currentReservation.assignedBikeCode).forEach(code => this.updateBikeStatus(code, 'available'))
    } else if (status === 'cancelled') {
      updatedReservation.status = 'cancelled'
      splitBikeCodes(currentReservation.assignedBikeCode).forEach(code => this.updateBikeStatus(code, 'available'))
    } else if (status === 'late') {
      updatedReservation.status = 'late'
    } else {
      updatedReservation.status = status
    }

    this.reservations[index] = updatedReservation
    return { reservation: updatedReservation }
  }

  async getAvailability() {
    this.refreshOverdueRentals()

    return this.bikeTypes.map(bikeType => {
      const bikes = this.bikes.filter(bike => bike.bikeType === bikeType.type)
      const reserved = this.reservations.filter(reservation => reservation.status === 'confirmed').reduce((total, reservation) => total + normalizeSelectionCount((reservation.bikeSelections || normalizeBikeSelections(reservation))[bikeType.type]), 0)
      const rented = bikes.filter(bike => bike.status === 'rented').length
      const available = Math.max(bikeType.total - reserved - rented, 0)

      return {
        ...bikeType,
        reserved,
        rented,
        available,
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
            groupSize: normalizeCount(reservation.groupSize),
            bikeQuantity: normalizeCount(reservation.bikeQuantity),
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

    await this.reconcileBikeAssignments()
  }

  async reconcileBikeAssignments() {
    const now = new Date()
    await this.db.collection('bikes').updateMany(
      { status: { $in: ['reserved', 'rented'] } },
      { $set: { status: 'available', updatedAt: now } },
    )

    const activeReservations = await this.db.collection('reservations')
      .find({ status: { $in: ['active', 'late'] } })
      .sort({ createdAt: 1 })
      .toArray()

    for (const reservation of activeReservations) {
      const bikeStatus = 'rented'
      const bikeSelections = reservation.bikeSelections || normalizeBikeSelections(reservation)
      const bikeQuantity = totalBikeSelections(bikeSelections)
      const assignedBikeCodes = splitBikeCodes(reservation.assignedBikeCode)
      let claimedBikeCodes = []

      if (assignedBikeCodes.length > 0) {
        const updateResult = await this.db.collection('bikes').updateMany(
          { bikeCode: { $in: assignedBikeCodes }, status: 'available' },
          { $set: { status: bikeStatus, updatedAt: now } },
        )

        if (updateResult.modifiedCount === assignedBikeCodes.length && assignedBikeCodes.length >= bikeQuantity) {
          claimedBikeCodes = assignedBikeCodes
        } else {
          await this.releaseBikeCodes(assignedBikeCodes, 'available')
        }
      }

      if (claimedBikeCodes.length < bikeQuantity) {
        const claimedBikes = await this.claimBikeSelections(bikeSelections, bikeStatus)
        claimedBikeCodes = claimedBikes.map(bike => bike.bikeCode)
      }

      if (claimedBikeCodes.length >= bikeQuantity) {
        await this.db.collection('reservations').updateOne(
          { _id: reservation._id },
          { $set: { assignedBikeCode: claimedBikeCodes.join(', '), updatedAt: now } },
        )
      }
    }
  }

  async refreshOverdueRentals() {
    const now = new Date()
    await this.db.collection('reservations').updateMany(
      {
        status: 'active',
        expectedReturnAt: { $ne: '', $lt: now.toISOString() },
      },
      { $set: { status: 'late', updatedAt: now } },
    )
  }

  async claimBikeSelections(bikeSelections, status) {
    const now = new Date()
    const claimedBikes = []

    for (const [bikeType, quantity] of Object.entries(bikeSelections)) {
      for (let index = 0; index < quantity; index += 1) {
        const claimedBike = await this.db.collection('bikes').findOneAndUpdate(
          { bikeType, status: 'available' },
          { $set: { status, updatedAt: now } },
          { returnDocument: 'after', sort: { bikeCode: 1 } },
        )

        if (!claimedBike) {
          await this.releaseBikeCodes(claimedBikes.map(bike => bike.bikeCode), 'available')
          return []
        }

        claimedBikes.push(claimedBike)
      }
    }

    return claimedBikes
  }

  async releaseBikeCodes(bikeCodes, status = 'available') {
    if (bikeCodes.length === 0) return
    await this.db.collection('bikes').updateMany(
      { bikeCode: { $in: bikeCodes } },
      { $set: { status, updatedAt: new Date() } },
    )
  }

  async getReservations(search = '') {
    await this.refreshOverdueRentals()

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
    const bikeSelections = normalizeBikeSelections(payload)
    const bikeQuantity = totalBikeSelections(bikeSelections)
    const groupSize = normalizeCount(payload.groupSize)
    const availability = await this.getAvailability()
    const unavailableType = Object.entries(bikeSelections).find(([type, quantity]) => {
      const requestedBikeType = availability.find(bikeType => bikeType.type === type)
      return !requestedBikeType || requestedBikeType.available < quantity
    })
    if (unavailableType) {
      return { error: 'Requested bike quantity is unavailable.', statusCode: 409 }
    }

    const claimedBikes = status === 'active' ? await this.claimBikeSelections(bikeSelections, 'rented') : []
    if (status === 'active' && claimedBikes.length < bikeQuantity) {
      return { error: 'Requested bike quantity is unavailable.', statusCode: 409 }
    }

    const document = {
      reference: createReference(status === 'active' ? 'WI' : 'BR'),
      assignedBikeCode: claimedBikes.map(bike => bike.bikeCode).join(', '),
      customerName: payload.customer.trim(),
      phone: payload.phone.trim(),
      groupSize,
      bikeQuantity,
      bikeType: Object.keys(bikeSelections)[0] || '',
      bikeSelections,
      duration: payload.duration,
      time: payload.time || (status === 'active' ? 'Walk-in' : 'Online'),
      agreementConfirmed: Boolean(payload.agreement),
      status,
      startedAt: status === 'active' ? now.toISOString() : '',
      expectedReturnAt: status === 'active' ? createExpectedReturnAt(payload.duration, now) : '',
      actualReturnAt: '',
      createdAt: now,
      updatedAt: now,
    }

    try {
      await this.db.collection('reservations').insertOne(document)
    } catch (error) {
      await this.releaseBikeCodes(claimedBikes.map(bike => bike.bikeCode), 'available')
      throw error
    }
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

    const existing = await this.db.collection('reservations').findOne({ reference: id })
    if (!existing) return { error: 'Reservation not found.', statusCode: 404 }

    const transitionError = validateStatusTransition(existing.status, status)
    if (transitionError) return { error: transitionError, statusCode: 409 }

    const now = new Date()
    const updates = { updatedAt: now }

    if (existing.status === 'confirmed' && status === 'active') {
      const bikeSelections = existing.bikeSelections || normalizeBikeSelections(existing)
      const bikeQuantity = totalBikeSelections(bikeSelections)
      const assignedBikeCodes = splitBikeCodes(existing.assignedBikeCode)
      let claimedBikes

      if (assignedBikeCodes.length > 0) {
        await this.releaseBikeCodes(assignedBikeCodes, 'rented')
        claimedBikes = assignedBikeCodes.map(bikeCode => ({ bikeCode }))
      } else {
        claimedBikes = await this.claimBikeSelections(bikeSelections, 'rented')
      }

      if (claimedBikes.length < bikeQuantity) return { error: 'Requested bike quantity is unavailable.', statusCode: 409 }

      updates.status = 'active'
      updates.assignedBikeCode = claimedBikes.map(bike => bike.bikeCode).join(', ')
      updates.startedAt = now.toISOString()
      updates.expectedReturnAt = createExpectedReturnAt(existing.duration, now)
      updates.actualReturnAt = ''
    } else if ((existing.status === 'active' || existing.status === 'late') && status === 'returned') {
      updates.status = calculateReturnStatus(existing, now)
      updates.actualReturnAt = now.toISOString()
    } else if (status === 'cancelled') {
      updates.status = 'cancelled'
    } else {
      updates.status = status
    }

    const result = await this.db.collection('reservations').findOneAndUpdate(
      { reference: id },
      { $set: updates },
      { returnDocument: 'after' },
    )

    if ((status === 'returned' || status === 'cancelled') && existing.assignedBikeCode) {
      await this.releaseBikeCodes(splitBikeCodes(existing.assignedBikeCode), 'available')
    }

    return { reservation: toApiReservation(result) }
  }

  async getAvailability() {
    await this.refreshOverdueRentals()

    const bikeTypes = await this.db.collection('bikeTypes').find().sort({ type: 1 }).toArray()
    const bikes = await this.db.collection('bikes').aggregate([
      { $group: { _id: '$bikeType', total: { $sum: 1 } } },
    ]).toArray()
    const rentedCounts = await this.db.collection('bikes').aggregate([
      { $match: { status: 'rented' } },
      { $group: { _id: '$bikeType', count: { $sum: { $ifNull: ['$bikeQuantity', 1] } } } },
    ]).toArray()
    const confirmedReservations = await this.db.collection('reservations')
      .find({ status: 'confirmed' })
      .toArray()

    return bikeTypes.map(bikeType => {
      const total = bikes.find(bike => bike._id === bikeType.type)?.total || 0
      const reserved = confirmedReservations.reduce((totalReserved, reservation) => (
        totalReserved + normalizeSelectionCount((reservation.bikeSelections || normalizeBikeSelections(reservation))[bikeType.type])
      ), 0)
      const rented = rentedCounts.find(count => count._id === bikeType.type)?.count || 0

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
  const forceMemory = process.env.STORAGE_DRIVER === 'memory' || process.env.USE_MONGODB === 'false'
  const store = uri && !forceMemory ? new MongoStore({ uri, databaseName }) : new MemoryStore()
  await store.initialize()
  return store
}
