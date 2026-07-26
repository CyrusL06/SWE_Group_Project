export const collectionSchemas = {
  customers: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'phone', 'createdAt'],
        properties: {
          name: { bsonType: 'string' },
          phone: { bsonType: 'string' },
          email: { bsonType: 'string' },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' },
        },
      },
    },
  },
  bikeTypes: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['type', 'createdAt'],
        properties: {
          type: { bsonType: 'string' },
          description: { bsonType: 'string' },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' },
        },
      },
    },
  },
  bikes: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['bikeCode', 'bikeType', 'status', 'createdAt'],
        properties: {
          bikeCode: { bsonType: 'string' },
          bikeType: { bsonType: 'string' },
          status: { enum: ['available', 'reserved', 'rented', 'maintenance'] },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' },
        },
      },
    },
  },
  reservations: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['reference', 'customerName', 'phone', 'bikeType', 'duration', 'agreementConfirmed', 'status', 'createdAt'],
        properties: {
          reference: { bsonType: 'string' },
          customerName: { bsonType: 'string' },
          phone: { bsonType: 'string' },
          bikeType: { bsonType: 'string' },
          duration: { bsonType: 'string' },
          groupMember: { bsonType: 'string' },
          time: { bsonType: 'string' },
          agreementConfirmed: { bsonType: 'bool' },
          status: { enum: ['confirmed', 'active', 'returned', 'cancelled'] },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' },
        },
      },
    },
  },
  rentals: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['reservationReference', 'customerName', 'bikeType', 'status', 'startedAt', 'createdAt'],
        properties: {
          reservationReference: { bsonType: 'string' },
          assignedBikeCode: { bsonType: 'string' },
          customerName: { bsonType: 'string' },
          bikeType: { bsonType: 'string' },
          status: { enum: ['active', 'returned', 'late', 'early return'] },
          startedAt: { bsonType: 'date' },
          expectedReturnAt: { bsonType: 'date' },
          actualReturnAt: { bsonType: 'date' },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' },
        },
      },
    },
  },
  agreements: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['reservationReference', 'confirmed', 'confirmedAt'],
        properties: {
          reservationReference: { bsonType: 'string' },
          confirmed: { bsonType: 'bool' },
          confirmedAt: { bsonType: 'date' },
        },
      },
    },
  },
  staff: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'role', 'createdAt'],
        properties: {
          name: { bsonType: 'string' },
          role: { enum: ['clerk', 'manager'] },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' },
        },
      },
    },
  },
}

export async function createCollectionIfMissing(db, name, options) {
  const existing = await db.listCollections({ name }).toArray()
  if (existing.length === 0) {
    await db.createCollection(name, options)
    return
  }

  await db.command({
    collMod: name,
    validator: options.validator,
    validationLevel: 'moderate',
  })
}

export async function initializeMongoSchema(db) {
  await Promise.all(Object.entries(collectionSchemas).map(([name, options]) => createCollectionIfMissing(db, name, options)))

  await Promise.all([
    db.collection('customers').createIndex({ phone: 1 }, { unique: true }),
    db.collection('bikeTypes').createIndex({ type: 1 }, { unique: true }),
    db.collection('bikes').createIndex({ bikeCode: 1 }, { unique: true }),
    db.collection('bikes').createIndex({ bikeType: 1, status: 1 }),
    db.collection('reservations').createIndex({ reference: 1 }, { unique: true }),
    db.collection('reservations').createIndex({ customerName: 'text', phone: 'text', reference: 'text', bikeType: 'text' }),
    db.collection('reservations').createIndex({ bikeType: 1, status: 1 }),
    db.collection('rentals').createIndex({ reservationReference: 1 }),
    db.collection('agreements').createIndex({ reservationReference: 1 }, { unique: true }),
    db.collection('staff').createIndex({ name: 1 }),
  ])
}
