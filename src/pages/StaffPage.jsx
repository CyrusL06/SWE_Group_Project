import { useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import Header from '../components/Header'
import { createWalkIn, getAvailability, getReservations, updateReservationStatus as updateReservationStatusApi } from '../services/api'

const walkInInitialForm = {
  customer: '',
  phone: '',
  bikeType: 'City bike',
  duration: '1 hour',
  agreement: false,
}

const fallbackBikeTypes = ['City bike', 'Electric bike', 'Cargo bike']

function statusLabel(status) {
  return status === 'active' ? 'active' : status === 'returned' ? 'returned' : status === 'cancelled' ? 'cancelled' : 'confirmed'
}

export default function StaffPage() {
  const [reservations, setReservations] = useState([])
  const [availability, setAvailability] = useState([])
  const [search, setSearch] = useState('')
  const [walkInForm, setWalkInForm] = useState(walkInInitialForm)
  const [walkInError, setWalkInError] = useState('')
  const [pageError, setPageError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const bikeOptions = useMemo(() => (
    availability.length > 0 ? availability.map(bike => bike.type) : fallbackBikeTypes
  ), [availability])

  useEffect(() => {
    let ignore = false

    async function loadStaffData() {
      setIsLoading(true)
      setPageError('')

      try {
        const [reservationPayload, availabilityPayload] = await Promise.all([
          getReservations(search),
          getAvailability(),
        ])

        if (!ignore) {
          setReservations(reservationPayload.reservations)
          setAvailability(availabilityPayload.availability)
        }
      } catch (error) {
        if (!ignore) setPageError(error.message || 'Could not load staff data.')
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    loadStaffData()

    return () => {
      ignore = true
    }
  }, [search])

  async function refreshStaffData() {
    const [reservationPayload, availabilityPayload] = await Promise.all([
      getReservations(search),
      getAvailability(),
    ])
    setReservations(reservationPayload.reservations)
    setAvailability(availabilityPayload.availability)
  }

  async function updateReservationStatus(id, status) {
    setPageError('')
    setIsSaving(true)

    try {
      await updateReservationStatusApi(id, status)
      await refreshStaffData()
    } catch (error) {
      setPageError(error.message || 'Could not update reservation status.')
    } finally {
      setIsSaving(false)
    }
  }

  function updateWalkInField(event) {
    const { checked, name, type, value } = event.target
    setWalkInForm(current => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setWalkInError('')
  }

  async function addWalkInRental(event) {
    event.preventDefault()

    if (!walkInForm.customer.trim() || !walkInForm.phone.trim()) {
      setWalkInError('Enter the walk-in customer name and phone number.')
      return
    }

    if (!walkInForm.agreement) {
      setWalkInError('Confirm the waiver/agreement before starting the rental.')
      return
    }

    setIsSaving(true)
    setWalkInError('')
    setPageError('')

    try {
      await createWalkIn({
        customer: walkInForm.customer.trim(),
        phone: walkInForm.phone.trim(),
        bikeType: walkInForm.bikeType,
        duration: walkInForm.duration,
        agreement: walkInForm.agreement,
      })
      setWalkInForm(walkInInitialForm)
      await refreshStaffData()
    } catch (error) {
      setWalkInError(error.message || 'Could not start walk-in rental.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="staff-page">
      <Header minimal />

      <main className="staff-main">
        <header className="staff-heading">
          <p className="reservation-context">Staff / Clerk interface</p>
          <h1>Daily rental board</h1>
          <p>Check reservations, search customers by name or phone number, view bike availability, and update rental status through the backend API.</p>
        </header>

        {pageError && <p className="staff-alert" role="alert">{pageError}</p>}

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

            {isLoading ? (
              <p className="staff-empty">Loading reservations...</p>
            ) : (
              <div className="reservation-table" role="table" aria-label="Daily reservations">
                <div className="reservation-row reservation-row-head" role="row">
                  <span>Customer</span>
                  <span>Bike</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>

                {reservations.length === 0 && <p className="staff-empty">No reservations match this search.</p>}

                {reservations.map(reservation => (
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
                      <button disabled={isSaving || reservation.status !== 'confirmed' || !reservation.agreement} onClick={() => updateReservationStatus(reservation.id, 'active')} type="button">Start</button>
                      <button disabled={isSaving || reservation.status !== 'active'} onClick={() => updateReservationStatus(reservation.id, 'returned')} type="button">Return</button>
                      <button disabled={isSaving || reservation.status === 'returned' || reservation.status === 'cancelled'} onClick={() => updateReservationStatus(reservation.id, 'cancelled')} type="button">Cancel</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
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
                  {bikeOptions.map(type => <option key={type} value={type}>{type}</option>)}
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
              <Button className="reservation-submit" disabled={isSaving} type="submit">{isSaving ? 'Saving...' : 'Start rental'}</Button>
            </form>
          </aside>
        </div>
      </main>
    </div>
  )
}
