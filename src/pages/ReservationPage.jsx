import { useMemo, useState } from 'react'
import Button from '../components/Button'
import Header from '../components/Header'
import { createReservation as createReservationApi } from '../services/api'

const initialForm = {
  fullName: '',
  phone: '',
  isGroupRental: false,
  groupMember: '',
  bikeType: '',
  duration: '',
  agreementConfirmed: false,
}

// Temporary UI options until bike types come from an approved inventory source.
const bikeTypes = ['City bike', 'Electric bike', 'Cargo bike']
const rentalDurations = ['1 hour', '2 hours', 'Half day', 'Full day']

function FieldError({ children, id }) {
  if (!children) return null

  return <span className="reservation-error" id={id}>{children}</span>
}

export default function ReservationPage() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedReservation, setSubmittedReservation] = useState(null)

  const hasDraft = useMemo(() => (
    form.fullName.trim()
    || form.phone.trim()
    || form.groupMember.trim()
    || form.bikeType
    || form.duration
    || form.isGroupRental
    || form.agreementConfirmed
  ), [form])

  function updateField(event) {
    const { checked, name, type, value } = event.target
    const nextValue = type === 'checkbox' ? checked : value

    setForm(current => ({
      ...current,
      [name]: nextValue,
      ...(name === 'isGroupRental' && !nextValue ? { groupMember: '' } : {}),
    }))
    setErrors(current => ({ ...current, [name]: undefined }))
    setSubmitError('')
    setSubmittedReservation(null)
  }

  function validate() {
    const nextErrors = {}

    if (!form.fullName.trim()) nextErrors.fullName = 'Enter your full name.'
    if (!form.phone.trim()) nextErrors.phone = 'Enter your phone number.'
    if (form.isGroupRental && !form.groupMember.trim()) nextErrors.groupMember = 'Enter at least one group member name.'
    if (!form.bikeType) nextErrors.bikeType = 'Select a bike type.'
    if (!form.duration) nextErrors.duration = 'Select a rental duration.'
    if (!form.agreementConfirmed) nextErrors.agreementConfirmed = 'Confirm the rental agreement before submitting.'

    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      document.getElementById(Object.keys(nextErrors)[0])?.focus()
      return
    }

    setErrors({})
    setSubmitError('')
    setIsSubmitting(true)

    try {
      const { reservation } = await createReservationApi({
        customer: form.fullName.trim(),
        phone: form.phone.trim(),
        bikeType: form.bikeType,
        duration: form.duration,
        agreement: form.agreementConfirmed,
        groupMember: form.isGroupRental ? form.groupMember.trim() : '',
      })

      setSubmittedReservation({
        id: reservation.id,
        fullName: reservation.customer,
        phone: reservation.phone,
        isGroupRental: form.isGroupRental,
        groupMember: form.groupMember.trim(),
        bikeType: reservation.bikeType,
        duration: reservation.duration,
        agreementConfirmed: reservation.agreement,
        status: reservation.status,
      })
    } catch (error) {
      setSubmitError(error.message || 'Could not submit reservation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setForm(initialForm)
    setErrors({})
    setSubmitError('')
    setSubmittedReservation(null)
    document.getElementById('fullName')?.focus()
  }

  return (
    <div className="reservation-page">
      <Header minimal />

      <main className="reservation-main">
        <header className="reservation-heading">
          <p className="reservation-context">Customer reservation</p>
          <h1>Reserve your bike</h1>
          <p>Tell us who is riding and what you need. The form submits through the backend reservation API and returns a confirmation reference.</p>
        </header>

        {submittedReservation && (
          <div className="reservation-confirmation" role="status" aria-live="polite">
            <span className="confirmation-mark" aria-hidden="true">✓</span>
            <div>
              <strong>Reservation confirmed</strong>
              <p>{submittedReservation.fullName}, your {submittedReservation.bikeType.toLowerCase()} request is confirmed for {submittedReservation.duration.toLowerCase()}. Reference: {submittedReservation.id}.</p>
            </div>
            <span className="status-chip">{submittedReservation.status}</span>
          </div>
        )}

        <div className="reservation-layout">
          <form className="reservation-form" id="reservation-form" onSubmit={handleSubmit} noValidate>
            <fieldset className="reservation-section">
              <legend>Customer details</legend>
              <div className="reservation-fields">
                <label className="reservation-field" htmlFor="fullName">
                  <span>Full name</span>
                  <input
                    aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                    aria-invalid={Boolean(errors.fullName)}
                    autoComplete="name"
                    id="fullName"
                    name="fullName"
                    onChange={updateField}
                    placeholder="Jordan Lee"
                    type="text"
                    value={form.fullName}
                  />
                  <FieldError id="fullName-error">{errors.fullName}</FieldError>
                </label>

                <label className="reservation-field" htmlFor="phone">
                  <span>Phone number</span>
                  <input
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    aria-invalid={Boolean(errors.phone)}
                    autoComplete="tel"
                    id="phone"
                    inputMode="tel"
                    name="phone"
                    onChange={updateField}
                    placeholder="(555) 123-4567"
                    type="tel"
                    value={form.phone}
                  />
                  <FieldError id="phone-error">{errors.phone}</FieldError>
                </label>
              </div>
            </fieldset>

            <fieldset className="reservation-section">
              <legend>Group members</legend>
              <label className="reservation-check" htmlFor="isGroupRental">
                <input
                  checked={form.isGroupRental}
                  id="isGroupRental"
                  name="isGroupRental"
                  onChange={updateField}
                  type="checkbox"
                />
                <span>
                  <strong>This is a group rental</strong>
                  <small>Add the name of at least one other rider.</small>
                </span>
              </label>

              {form.isGroupRental && (
                <label className="reservation-field group-member-field" htmlFor="groupMember">
                  <span>Group member name</span>
                  <input
                    aria-describedby={errors.groupMember ? 'groupMember-error' : undefined}
                    aria-invalid={Boolean(errors.groupMember)}
                    autoComplete="off"
                    id="groupMember"
                    name="groupMember"
                    onChange={updateField}
                    placeholder="Taylor Morgan"
                    type="text"
                    value={form.groupMember}
                  />
                  <FieldError id="groupMember-error">{errors.groupMember}</FieldError>
                </label>
              )}
            </fieldset>

            <fieldset className="reservation-section">
              <legend>Ride details</legend>
              <div className="reservation-fields">
                <label className="reservation-field" htmlFor="bikeType">
                  <span>Bike type</span>
                  <select
                    aria-describedby={errors.bikeType ? 'bikeType-error' : 'bikeType-help'}
                    aria-invalid={Boolean(errors.bikeType)}
                    id="bikeType"
                    name="bikeType"
                    onChange={updateField}
                    value={form.bikeType}
                  >
                    <option value="">Select a bike</option>
                    {bikeTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <small className="reservation-help" id="bikeType-help">Bike types are request options; availability is not checked yet.</small>
                  <FieldError id="bikeType-error">{errors.bikeType}</FieldError>
                </label>

                <label className="reservation-field" htmlFor="duration">
                  <span>Rental duration</span>
                  <select
                    aria-describedby={errors.duration ? 'duration-error' : undefined}
                    aria-invalid={Boolean(errors.duration)}
                    id="duration"
                    name="duration"
                    onChange={updateField}
                    value={form.duration}
                  >
                    <option value="">Select a duration</option>
                    {rentalDurations.map(duration => <option key={duration} value={duration}>{duration}</option>)}
                  </select>
                  <FieldError id="duration-error">{errors.duration}</FieldError>
                </label>
              </div>
            </fieldset>

            <fieldset className="reservation-section agreement-section">
              <legend>Rental agreement</legend>
              <label className="reservation-check" htmlFor="agreementConfirmed">
                <input
                  aria-describedby={errors.agreementConfirmed ? 'agreementConfirmed-error' : undefined}
                  aria-invalid={Boolean(errors.agreementConfirmed)}
                  checked={form.agreementConfirmed}
                  id="agreementConfirmed"
                  name="agreementConfirmed"
                  onChange={updateField}
                  type="checkbox"
                />
                <span>
                  <strong>I confirm the waiver and rental agreement</strong>
                  <small>This confirmation is required to reserve a bike.</small>
                </span>
              </label>
              <FieldError id="agreementConfirmed-error">{errors.agreementConfirmed}</FieldError>
            </fieldset>
          </form>

          <aside className="reservation-review" aria-labelledby="review-title">
            <div className="review-heading">
              <p>Review</p>
              <h2 id="review-title">Your reservation</h2>
            </div>

            <dl className="review-list">
              <div><dt>Customer</dt><dd>{form.fullName.trim() || 'Not entered'}</dd></div>
              <div><dt>Phone</dt><dd>{form.phone.trim() || 'Not entered'}</dd></div>
              <div><dt>Rental</dt><dd>{form.isGroupRental ? 'Group rental' : 'Individual rental'}</dd></div>
              {form.isGroupRental && <div><dt>Group member</dt><dd>{form.groupMember.trim() || 'Not entered'}</dd></div>}
              <div><dt>Bike type</dt><dd>{form.bikeType || 'Not selected'}</dd></div>
              <div><dt>Duration</dt><dd>{form.duration || 'Not selected'}</dd></div>
              <div><dt>Agreement</dt><dd>{form.agreementConfirmed ? 'Confirmed' : 'Not confirmed'}</dd></div>
            </dl>

            <Button className="reservation-submit" disabled={isSubmitting} form="reservation-form" type="submit">
              {isSubmitting ? 'Submitting...' : 'Confirm reservation'}
            </Button>
            <button className="reservation-reset" disabled={!hasDraft && !submittedReservation} onClick={resetForm} type="button">
              Start new reservation
            </button>
            {submitError && <p className="reservation-error review-note" role="alert">{submitError}</p>}
            <p className="review-note">Reservations are sent to the backend API for this prototype.</p>
          </aside>
        </div>

        {submittedReservation && (
          <section className="submitted-reservation" aria-labelledby="submitted-reservation-title">
            <div className="review-heading">
              <p>Submitted request</p>
              <h2 id="submitted-reservation-title">Reservation details</h2>
            </div>
            <dl className="submitted-reservation-list">
              <div><dt>Reference</dt><dd>{submittedReservation.id}</dd></div>
              <div><dt>Customer</dt><dd>{submittedReservation.fullName}</dd></div>
              <div><dt>Phone</dt><dd>{submittedReservation.phone}</dd></div>
              <div><dt>Rental</dt><dd>{submittedReservation.isGroupRental ? `Group rental: ${submittedReservation.groupMember}` : 'Individual rental'}</dd></div>
              <div><dt>Bike type</dt><dd>{submittedReservation.bikeType}</dd></div>
              <div><dt>Duration</dt><dd>{submittedReservation.duration}</dd></div>
              <div><dt>Agreement</dt><dd>{submittedReservation.agreementConfirmed ? 'Confirmed' : 'Not confirmed'}</dd></div>
              <div><dt>Status</dt><dd>{submittedReservation.status}</dd></div>
            </dl>
          </section>
        )}
      </main>
    </div>
  )
}
