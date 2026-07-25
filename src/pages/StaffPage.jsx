import { useMemo, useState } from 'react'
import Button from '../components/Button'
import Header from '../components/Header'

const initialReservations = [
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
  {
    id: 'BR-104266',
    customer: 'Alex Chen',
    phone: '604-555-0177',
    bikeType: 'Cargo bike',
    duration: 'Full day',
    time: '1:00 PM',
    agreement: false,
    status: 'confirmed',
  },
]

const initialBikeTypes = [
  { type: 'City bike', total: 8, reserved: 2, rented: 1 },
  { type: 'Electric bike', total: 5, reserved: 1, rented: 2 },
  { type: 'Cargo bike', total: 3, reserved: 1, rented: 0 },
]

const walkInInitialForm = {
  customer: '',
  phone: '',
  bikeType: 'City bike',
  duration: '1 hour',
  agreement: false,
}

function statusLabel(status) {
  return status === 'active' ? 'active' : status === 'returned' ? 'returned' : status === 'cancelled' ? 'cancelled' : 'confirmed'
}

export default function StaffPage() {
  const [reservations, setReservations] = useState(initialReservations)
  const [search, setSearch] = useState('')
  const [walkInForm, setWalkInForm] = useState(walkInInitialForm)
  const [walkInError, setWalkInError] = useState('')

  const filteredReservations = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return reservations

    return reservations.filter(reservation => (
      reservation.customer.toLowerCase().includes(term)
      || reservation.phone.includes(term)
      || reservation.id.toLowerCase().includes(term)
      || reservation.bikeType.toLowerCase().includes(term)
    ))
  }, [reservations, search])

  const availability = useMemo(() => initialBikeTypes.map(bike => {
    const activeCount = reservations.filter(reservation => reservation.bikeType === bike.type && reservation.status === 'active').length
    const confirmedCount = reservations.filter(reservation => reservation.bikeType === bike.type && reservation.status === 'confirmed').length

    return {
      ...bike,
      reserved: confirmedCount,
      rented: activeCount,
      available: Math.max(bike.total - confirmedCount - activeCount, 0),
    }
  }), [reservations])

  function updateReservationStatus(id, status) {
    setReservations(current => current.map(reservation => (
      reservation.id === id ? { ...reservation, status } : reservation
    )))
  }

  function updateWalkInField(event) {
    const { checked, name, type, value } = event.target
    setWalkInForm(current => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setWalkInError('')
  }

  function addWalkInRental(event) {
    event.preventDefault()

    if (!walkInForm.customer.trim() || !walkInForm.phone.trim()) {
      setWalkInError('Enter the walk-in customer name and phone number.')
      return
    }

    if (!walkInForm.agreement) {
      setWalkInError('Confirm the waiver/agreement before starting the rental.')
      return
    }

    setReservations(current => [{
      id: `WI-${Date.now().toString().slice(-6)}`,
      customer: walkInForm.customer.trim(),
      phone: walkInForm.phone.trim(),
      bikeType: walkInForm.bikeType,
      duration: walkInForm.duration,
      time: 'Walk-in',
      agreement: walkInForm.agreement,
      status: 'active',
    }, ...current])

    setWalkInForm(walkInInitialForm)
  }

  return (
    <div className="staff-page">
      <Header minimal />

      <main className="staff-main">
        <header className="staff-heading">
          <p className="reservation-context">Staff / Clerk interface</p>
          <h1>Daily rental board</h1>
          <p>Check reservations, search customers by name or phone number, view bike availability, and update rental status during the shift.</p>
        </header>

        <section className="staff-metrics" aria-label="Bike availability by type">
          {availability.map(bike => (
            <article className="availability-card" key={bike.type}>
              <p>{bike.type}</p>
              <strong>{bike.available}</strong>
              <span>available of {bike.total}</span>
              <small>{bike.reserved} reserved · {bike.rented} active</small>
            </article>
          ))}
        </section>

        <div className="staff-grid">
          <section className="staff-panel" aria-labelledby="reservations-title">
            <div className="staff-panel-heading">
              <div>
                <p className="reservation-context">Today</p>
                <h2 id="reservations-title">Reservations</h2>
              </div>
              <label className="staff-search" htmlFor="reservationSearch">
                <span>Search</span>
                <input
                  id="reservationSearch"
                  name="reservationSearch"
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Name, phone, bike, or reference"
                  type="search"
                  value={search}
                />
              </label>
            </div>

            <div className="reservation-table" role="table" aria-label="Daily reservations">
              <div className="reservation-row reservation-row-head" role="row">
                <span>Customer</span>
                <span>Bike</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {filteredReservations.map(reservation => (
                <article className="reservation-row" role="row" key={reservation.id}>
                  <div>
                    <strong>{reservation.customer}</strong>
                    <small>{reservation.id} · {reservation.phone} · {reservation.time}</small>
                  </div>
                  <div>
                    <strong>{reservation.bikeType}</strong>
                    <small>{reservation.duration} · Agreement {reservation.agreement ? 'confirmed' : 'missing'}</small>
                  </div>
                  <span className={`staff-status staff-status-${statusLabel(reservation.status)}`}>{statusLabel(reservation.status)}</span>
                  <div className="staff-actions">
                    <button disabled={reservation.status !== 'confirmed' || !reservation.agreement} onClick={() => updateReservationStatus(reservation.id, 'active')} type="button">Start</button>
                    <button disabled={reservation.status !== 'active'} onClick={() => updateReservationStatus(reservation.id, 'returned')} type="button">Return</button>
                    <button disabled={reservation.status === 'returned' || reservation.status === 'cancelled'} onClick={() => updateReservationStatus(reservation.id, 'cancelled')} type="button">Cancel</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="staff-panel walkin-panel" aria-labelledby="walkin-title">
            <p className="reservation-context">Walk-in</p>
            <h2 id="walkin-title">Start walk-in rental</h2>
            <form className="walkin-form" onSubmit={addWalkInRental} noValidate>
              <label className="reservation-field" htmlFor="walkInCustomer">
                <span>Customer name</span>
                <input id="walkInCustomer" name="customer" onChange={updateWalkInField} placeholder="Sam Rivera" type="text" value={walkInForm.customer} />
              </label>
              <label className="reservation-field" htmlFor="walkInPhone">
                <span>Phone number</span>
                <input id="walkInPhone" name="phone" onChange={updateWalkInField} placeholder="604-555-0100" type="tel" value={walkInForm.phone} />
              </label>
              <label className="reservation-field" htmlFor="walkInBike">
                <span>Bike type</span>
                <select id="walkInBike" name="bikeType" onChange={updateWalkInField} value={walkInForm.bikeType}>
                  {initialBikeTypes.map(bike => <option key={bike.type} value={bike.type}>{bike.type}</option>)}
                </select>
              </label>
              <label className="reservation-field" htmlFor="walkInDuration">
                <span>Duration</span>
                <select id="walkInDuration" name="duration" onChange={updateWalkInField} value={walkInForm.duration}>
                  <option>1 hour</option>
                  <option>2 hours</option>
                  <option>Half day</option>
                  <option>Full day</option>
                </select>
              </label>
              <label className="reservation-check" htmlFor="walkInAgreement">
                <input checked={walkInForm.agreement} id="walkInAgreement" name="agreement" onChange={updateWalkInField} type="checkbox" />
                <span>
                  <strong>Waiver/agreement confirmed</strong>
                  <small>Required before staff starts the rental.</small>
                </span>
              </label>
              {walkInError && <p className="reservation-error">{walkInError}</p>}
              <Button className="reservation-submit" type="submit">Start rental</Button>
            </form>
          </aside>
        </div>
      </main>
    </div>
  )
}
