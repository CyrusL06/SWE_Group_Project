import { AnimatePresence, motion } from 'framer-motion'
import QRCode from 'qrcode'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Button from '../components/Button'
import Header from '../components/Header'
import { createReservation as createReservationApi } from '../services/api'

const defaultValues = {
  fullName: '',
  phone: '',
  isGroupRental: false,
  groupSize: 1,
  bikeSelections: {
    'City bike': 1,
    'Electric bike': 0,
    'Cargo bike': 0,
  },
  duration: '',
  agreementConfirmed: false,
}

const bikeTypes = ['City bike', 'Electric bike', 'Cargo bike']
const rentalDurations = ['1 hour', '2 hours', 'Half day', 'Full day']

const termsPlaceholder = [
  'Riders must return bikes by the selected rental duration.',
  'Riders are responsible for damage, loss, or late returns during the rental period.',
  'Helmets and safe riding practices are recommended for all riders.',
  'Staff may refuse or cancel a rental if availability or safety conditions change.',
]

const cardVariants = {
  enter: direction => ({
    opacity: 0,
    x: direction > 0 ? 96 : -96,
    scale: 0.985,
    filter: 'blur(6px)',
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      delayChildren: 0.025,
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.035,
      when: 'beforeChildren',
    },
  },
  exit: direction => ({
    opacity: 0,
    x: direction > 0 ? -96 : 96,
    scale: 0.985,
    filter: 'blur(5px)',
    transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] },
  }),
}

const stepItemVariants = {
  enter: { opacity: 0, y: 12, filter: 'blur(3px)' },
  center: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -6, filter: 'blur(2px)', transition: { duration: 0.12 } },
}

const revealVariants = {
  hidden: { opacity: 0, y: 12, height: 0 },
  visible: { opacity: 1, y: 0, height: 'auto' },
  exit: { opacity: 0, y: -8, height: 0 },
}

function FieldError({ children }) {
  if (!children) return null
  return <p className="typeform-error" role="alert">{children}</p>
}

function StepCard({ children, direction, stepKey }) {
  return (
    <motion.section
      animate="center"
      className="typeform-card"
      custom={direction}
      exit="exit"
      initial="enter"
      key={stepKey}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      variants={cardVariants}
    >
      {children}
    </motion.section>
  )
}

function clampCount(value, min = 1, max = 10) {
  return Math.min(Math.max(Number(value) || min, min), max)
}

export default function ReservationPage() {
  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedReservation, setSubmittedReservation] = useState(null)
  const [reservationQrImage, setReservationQrImage] = useState('')

  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    reset,
    setFocus,
    setValue,
    trigger,
    watch,
  } = useForm({ defaultValues, mode: 'onTouched' })

  const isGroupRental = watch('isGroupRental')
  const groupSize = clampCount(watch('groupSize'))
  const bikeSelections = watch('bikeSelections')
  const totalBikeQuantity = Object.values(bikeSelections || {}).reduce((total, value) => total + (Number(value) || 0), 0)

  function updateCount(field, delta) {
    const nextValue = clampCount(getValues(field) + delta)
    setValue(field, nextValue, { shouldDirty: true, shouldValidate: true })

    if (field === 'groupSize') {
      const selections = getValues('bikeSelections')
      const selectedTotal = Object.values(selections).reduce((total, value) => total + (Number(value) || 0), 0)
      if (selectedTotal > nextValue) {
        setValue('bikeSelections', { 'City bike': nextValue, 'Electric bike': 0, 'Cargo bike': 0 }, { shouldDirty: true, shouldValidate: true })
      }
    }
  }

  function updateBikeSelection(type, delta) {
    const selections = getValues('bikeSelections')
    const cap = isGroupRental ? groupSize : 1
    const selectedTotal = Object.values(selections).reduce((total, value) => total + (Number(value) || 0), 0)
    const currentTypeCount = Number(selections[type]) || 0

    if (delta > 0 && selectedTotal >= cap) return
    const nextTypeCount = Math.max(currentTypeCount + delta, 0)
    const nextSelections = { ...selections, [type]: nextTypeCount }
    setValue('bikeSelections', nextSelections, { shouldDirty: true, shouldValidate: true })
  }

  function selectRentalType(nextIsGroupRental) {
    const nextGroupSize = nextIsGroupRental ? Math.max(groupSize, 2) : 1
    reset({
      ...getValues(),
      isGroupRental: nextIsGroupRental,
      groupSize: nextGroupSize,
      bikeSelections: { 'City bike': 1, 'Electric bike': 0, 'Cargo bike': 0 },
    }, { keepErrors: true })
  }

  const steps = [
    {
      id: 'fullName',
      field: 'fullName',
      eyebrow: 'Customer details',
      title: 'What is your full name?',
      help: 'Use the name staff should search for at check-in.',
      render: () => (
        <input
          autoComplete="name"
          className="typeform-input"
          placeholder="Jordan Lee"
          type="text"
          {...register('fullName', { required: 'Enter your full name.' })}
        />
      ),
    },
    {
      id: 'phone',
      field: 'phone',
      eyebrow: 'Customer details',
      title: 'What phone number should staff use?',
      help: 'Staff can look up reservations by phone number.',
      render: () => (
        <input
          autoComplete="tel"
          className="typeform-input"
          inputMode="tel"
          placeholder="604-555-0100"
          type="tel"
          {...register('phone', { required: 'Enter your phone number.' })}
        />
      ),
    },
    {
      id: 'isGroupRental',
      field: 'isGroupRental',
      eyebrow: 'Group rental',
      title: 'Is this a group rental?',
      help: 'Choose group rental if more than one rider needs a bike.',
      render: () => (
        <div className="typeform-group-panel">
          <div className="typeform-choice-grid">
            <label className="typeform-choice">
              <input type="radio" value="false" checked={!getValues('isGroupRental')} onChange={() => selectRentalType(false)} />
              <span>Individual rental</span>
            </label>
            <label className="typeform-choice">
              <input type="radio" value="true" checked={getValues('isGroupRental')} onChange={() => selectRentalType(true)} />
              <span>Group rental</span>
            </label>
          </div>

          <AnimatePresence initial={false}>
            {isGroupRental && (
              <motion.div
                animate="visible"
                className="typeform-inline-count"
                exit="exit"
                initial="hidden"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                variants={revealVariants}
              >
                <span>How many people are joining?</span>
                <div className="typeform-counter" aria-label="Group size selector">
                  <button onClick={() => updateCount('groupSize', -1)} type="button">−</button>
                  <motion.strong animate={{ scale: [1, 1.12, 1] }} key={groupSize} transition={{ duration: 0.22 }}>{groupSize}</motion.strong>
                  <button onClick={() => updateCount('groupSize', 1)} type="button">+</button>
                  <input type="hidden" {...register('groupSize', { min: 1, valueAsNumber: true })} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ),
    },
    {
      id: 'bikeSelections',
      field: 'bikeSelections',
      eyebrow: 'Ride details',
      title: 'What bikes does your group need?',
      help: `Pick one or more bike types. Total bikes cannot exceed ${isGroupRental ? groupSize : 1}.`,
      render: () => (
        <div className="typeform-bike-step">
          <input
            type="hidden"
            {...register('bikeSelections', {
              validate: selections => {
                const selectedTotal = Object.values(selections || {}).reduce((total, value) => total + (Number(value) || 0), 0)
                const cap = isGroupRental ? groupSize : 1
                if (selectedTotal < 1) return 'Select at least one bike.'
                if (selectedTotal > cap) return `Select no more than ${cap} ${cap === 1 ? 'bike' : 'bikes'}.`
                return true
              },
            })}
          />
          <motion.div className="typeform-bike-selection-list" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.055 } } }}>
            {bikeTypes.map(type => {
              const count = Number(bikeSelections?.[type]) || 0
              return (
                <motion.div className="typeform-bike-selection" key={type} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}>
                  <span>{type}</span>
                  <div className="typeform-counter typeform-bike-counter" aria-label={`${type} quantity selector`}>
                    <button onClick={() => updateBikeSelection(type, -1)} type="button">−</button>
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.strong animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.9 }} initial={{ opacity: 0, y: 8, scale: 0.9 }} key={`${type}-${count}`} transition={{ duration: 0.18 }}>{count}</motion.strong>
                    </AnimatePresence>
                    <button disabled={totalBikeQuantity >= (isGroupRental ? groupSize : 1)} onClick={() => updateBikeSelection(type, 1)} type="button">+</button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
          <motion.p animate={{ opacity: 1, y: 0 }} className="typeform-selection-total" initial={{ opacity: 0, y: 8 }} key={totalBikeQuantity}>{totalBikeQuantity} / {isGroupRental ? groupSize : 1} bikes selected</motion.p>
        </div>
      ),
    },
    {
      id: 'duration',
      field: 'duration',
      eyebrow: 'Ride details',
      title: 'How long do you need the bike?',
      help: 'Staff will use this to calculate expected return time.',
      render: () => (
        <div className="typeform-choice-grid">
          {rentalDurations.map(duration => (
            <label className="typeform-choice" key={duration}>
              <input type="radio" value={duration} {...register('duration', { required: 'Select a rental duration.' })} />
              <span>{duration}</span>
            </label>
          ))}
        </div>
      ),
    },
    {
      id: 'agreementConfirmed',
      field: 'agreementConfirmed',
      eyebrow: 'Rental agreement',
      title: 'Review the terms and confirm.',
      help: 'Placeholder terms for the demo. These would become the real shop rental agreement later.',
      render: () => (
        <div className="typeform-terms-block">
          <ul>
            {termsPlaceholder.map(term => <li key={term}>{term}</li>)}
          </ul>
          <label className="typeform-agreement">
            <input type="checkbox" {...register('agreementConfirmed', { required: 'Confirm the rental agreement before submitting.' })} />
            <span>I understand and agree to these rental terms.</span>
          </label>
        </div>
      ),
    },
  ]

  const currentStep = steps[Math.min(stepIndex, steps.length - 1)]
  const progress = `${Math.min(stepIndex + 1, steps.length)} / ${steps.length}`

  async function goNext() {
    setSubmitError('')
    const isValid = await trigger(currentStep.field)
    if (!isValid) return

    if (stepIndex < steps.length - 1) {
      setDirection(1)
      setStepIndex(current => current + 1)
      window.setTimeout(() => setFocus(steps[Math.min(stepIndex + 1, steps.length - 1)].field), 100)
      return
    }

    await handleSubmit(submitReservation)()
  }

  function goBack() {
    if (stepIndex === 0) return
    setSubmitError('')
    setDirection(-1)
    setStepIndex(current => current - 1)
  }

  async function submitReservation(values) {
    setIsSubmitting(true)
    setSubmitError('')

    const payload = {
      customer: values.fullName.trim(),
      phone: values.phone.trim(),
      bikeSelections: values.bikeSelections,
      duration: values.duration,
      agreement: values.agreementConfirmed,
      groupSize: values.isGroupRental ? clampCount(values.groupSize) : 1,
    }

    try {
      const { reservation } = await createReservationApi(payload)
      const qrPayload = {
        reference: reservation.id,
        customer: reservation.customer,
        phone: reservation.phone,
        bikeSelections: reservation.bikeSelections,
        duration: reservation.duration,
        status: reservation.status,
      }
      const qrImage = await QRCode.toDataURL(JSON.stringify(qrPayload), {
        errorCorrectionLevel: 'H',
        margin: 2,
        scale: 8,
        width: 260,
      })

      setSubmittedReservation(reservation)
      setReservationQrImage(qrImage)
    } catch (error) {
      setSubmitError(error.message || 'Could not submit reservation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function startOver() {
    reset(defaultValues)
    setSubmittedReservation(null)
    setReservationQrImage('')
    setSubmitError('')
    setDirection(-1)
    setStepIndex(0)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      goNext()
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      goBack()
    }
  }

  return (
    <div className="typeform-page" onKeyDown={handleKeyDown}>
      <Header minimal />

      <main className="typeform-main">
        <div className="typeform-progress" aria-label={`Step ${progress}`}>
          <span>{progress}</span>
          <div><motion.i animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} /></div>
        </div>

        {submittedReservation ? (
          <motion.section animate={{ opacity: 1, y: 0 }} className="typeform-card typeform-success" aria-labelledby="reservation-success-title" initial={{ opacity: 0, y: 18 }} transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}>
            <p className="reservation-context">Reservation submitted</p>
            <h1 id="reservation-success-title">You’re confirmed.</h1>
            <p>{submittedReservation.customer}, your bike reservation is confirmed. Reference: <strong>{submittedReservation.id}</strong>.</p>

            <div className="reservation-receipt-qr">
              <div>
                <span>Customer pickup QR</span>
                <strong>{submittedReservation.id}</strong>
                <p>Screenshot this code and show it to staff when you arrive.</p>
              </div>
              {reservationQrImage && <img alt={`Reservation QR code for ${submittedReservation.id}`} src={reservationQrImage} />}
            </div>

            <Button type="button" onClick={startOver}>Start another reservation</Button>
          </motion.section>
        ) : (
          <form className="typeform-shell" onSubmit={event => event.preventDefault()} noValidate>
            <AnimatePresence custom={direction} initial>
              <StepCard direction={direction} stepKey={currentStep.id}>
                <motion.p className="reservation-context" variants={stepItemVariants}>{currentStep.eyebrow}</motion.p>
                <motion.h1 variants={stepItemVariants}>{currentStep.title}</motion.h1>
                <motion.p variants={stepItemVariants}>{currentStep.help}</motion.p>

                <motion.div className="typeform-answer" variants={stepItemVariants}>
                  {currentStep.render()}
                  <FieldError>{errors[currentStep.field]?.message}</FieldError>
                </motion.div>

                {submitError && <motion.p className="typeform-error" role="alert" variants={stepItemVariants}>{submitError}</motion.p>}

                <motion.div className="typeform-actions" variants={stepItemVariants}>
                  <button className="typeform-back" disabled={stepIndex === 0 || isSubmitting} onClick={goBack} type="button">Back</button>
                  <button className="typeform-next" disabled={isSubmitting} onClick={goNext} type="button">
                    {stepIndex === steps.length - 1 ? (isSubmitting ? 'Submitting...' : 'Submit') : 'Next'}
                  </button>
                </motion.div>

                <motion.p className="typeform-keyboard-hint" variants={stepItemVariants}>Press Enter ↵ to continue · Esc to go back</motion.p>
              </StepCard>
            </AnimatePresence>
          </form>
        )}
      </main>
    </div>
  )
}
