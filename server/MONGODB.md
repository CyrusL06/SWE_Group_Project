# MongoDB Database Design

The backend supports MongoDB through `MONGODB_URI` and falls back to in-memory storage when no MongoDB connection string is provided.

## Run with MongoDB

```bash
MONGODB_URI=mongodb://127.0.0.1:27017 MONGODB_DATABASE=bike_rental npm run db:init
MONGODB_URI=mongodb://127.0.0.1:27017 MONGODB_DATABASE=bike_rental npm run server
```

## Collections

| Collection | Purpose |
|---|---|
| `customers` | Stores renter names and phone numbers. |
| `bikeTypes` | Stores bike categories such as City bike, Electric bike, and Cargo bike. |
| `bikes` | Stores individual physical bikes and status. |
| `reservations` | Stores online/QR reservations and walk-in rental requests. |
| `rentals` | Stores active/returned rental lifecycle details for future implementation. |
| `agreements` | Stores waiver/agreement confirmation records. |
| `staff` | Stores staff/clerk accounts for future staff workflows. |

## Reservation document example

```json
{
  "reference": "BR-104238",
  "customerName": "Jordan Lee",
  "phone": "604-555-0184",
  "bikeType": "City bike",
  "duration": "2 hours",
  "groupMember": "",
  "time": "10:00 AM",
  "agreementConfirmed": true,
  "status": "confirmed",
  "createdAt": "2026-07-25T00:00:00.000Z",
  "updatedAt": "2026-07-25T00:00:00.000Z"
}
```

## Bike document example

```json
{
  "bikeCode": "CITY-001",
  "bikeType": "City bike",
  "status": "available",
  "createdAt": "2026-07-25T00:00:00.000Z"
}
```

## Status values

### Reservation statuses

```text
confirmed
active
returned
cancelled
```

### Bike statuses

```text
available
reserved
rented
maintenance
```

### Rental statuses

```text
active
returned
late
early return
```

## Indexes

| Collection | Index |
|---|---|
| `customers` | unique `phone` |
| `bikeTypes` | unique `type` |
| `bikes` | unique `bikeCode`; compound `bikeType + status` |
| `reservations` | unique `reference`; searchable customer/phone/reference/bike type; compound `bikeType + status` |
| `rentals` | `reservationReference` |
| `agreements` | unique `reservationReference` |
| `staff` | `name` |

## Notes

This is a NoSQL design, not SQL. References are stored as readable fields such as `reference`, `reservationReference`, `bikeType`, and `phone` instead of foreign keys. That keeps the prototype simple while still matching the report's domain model.
