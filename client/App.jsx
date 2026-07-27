import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Button from './components/Button'
import FeatureCard from './components/FeatureCard'
import Header from './components/Header'
import HeroRide from './components/HeroRide'
import Logo from './components/Logo'
import { featureCards, footerHighlights, footerLinks, processSteps } from './data/siteContent'
import LoginPage from './pages/LoginPage'
import QrCodePage from './pages/QrCodePage'
import ReservationPage from './pages/ReservationPage'
import StaffPage from './pages/StaffPage'
import { getStaffSession } from './services/auth'

function RequireStaffAuth({ children }) {
  const location = useLocation()
  const session = getStaffSession()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

function Announcement() {
  return (
    <div className="announcement">
      <a href="/qr-code">
        Scan-to-reserve flow for customers at the bike rental shop
        <span> →</span>
      </a>
    </div>
  )
}

function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="eyebrow">Bike rental management</div>
        <h1>Reserve bikes faster. Run rentals cleaner.</h1>
        <p>A simple booking and staff board for bike shops: customer reservations, QR entry, live bike-type availability, check-ins, walk-ins, returns, and cancellations.</p>

        <div className="button-row">
          <Button href="/reserve">Reserve a bike</Button>
          <Button href="/qr-code" variant="secondary">Show QR code</Button>
        </div>
      </div>

      <HeroRide />
    </section>
  )
}

function Testimonial() {
  return (
    <section className="section-shell testimonial" id="operations">
      <div className="quote-mark">“</div>
      <blockquote>
        The shop does not need another spreadsheet. Customers reserve before they arrive, staff see the day’s rentals in one place, and bike counts stay tied to real reservation status.
      </blockquote>

      <div className="testimonial-author">
        <div className="avatar">BR</div>
        <div>
          <div className="name">Bike Rental Team</div>
          <div className="title">Staff / Clerk workflow</div>
        </div>
      </div>
    </section>
  )
}

function DemoCta() {
  return (
    <section className="section-shell demo-cta" id="demo">
      <div className="demo-card">
        <div>
          <div className="eyebrow eyebrow-dark">Customer booking</div>
          <h2>Let customers reserve online or from the shop QR code.</h2>
        </div>

        <p>The form collects the customer name, phone number, bike type, rental duration, and agreement confirmation so staff can check them in quickly.</p>
        <Button href="/reserve" variant="accent">Start a reservation</Button>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section className="section-shell features" id="features">
      <div className="features-heading">
        <div className="eyebrow">Platform</div>
        <div>
          <h2>The required rental workflow without the extra fluff.</h2>
          <p>Built around the project report: reservations, bike-type availability, staff check-in, walk-ins, returns, late rentals, and cancellations. No payments. No owner dashboard pretending to exist.</p>
        </div>
      </div>

      <div className="feature-cards">
        {featureCards.map((feature) => (
          <FeatureCard key={feature.badge} {...feature} />
        ))}
      </div>
    </section>
  )
}

function Steps() {
  return (
    <section className="section-shell steps">
      <div className="steps-header">
        <div className="eyebrow">Rental flow</div>
        <h2>From reservation to return in three clean steps.</h2>
      </div>

      <div className="steps-grid">
        {processSteps.map(([number, title, copy]) => (
          <article className="step-card" key={number}>
            <div className="step-number">{number}</div>
            <div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="section-shell footer-cta">
      <h2>Keep the rental counter moving.</h2>
      <p>Customers book quickly. Staff find them quickly. Bike availability updates as reservations become active rentals and returned bikes become available again.</p>
      <Button href="/reserve">Start a reservation</Button>

      <div className="highlights-grid">
        {footerHighlights.map(([title, copy]) => (
          <div className="highlight-card" key={title}>
            <h3>{title}</h3>
            <p>{copy}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="section-shell site-footer">
      <div className="footer-grid">
        <div>
          <a href="/" aria-label="CommuteTrack home" className="logo-link footer-logo">
            <Logo />
          </a>
          <p className="footer-disclaimer">CommuteTrack is a student bike rental management prototype focused on customer reservations, QR booking, staff check-in, walk-in rentals, returns, cancellations, and bike-type availability. Payments and owner reporting are outside this version.</p>
        </div>

        {footerLinks.map(([heading, links]) => (
          <div className="footer-links" key={heading}>
            <h4>{heading}</h4>
            {links.map(([label, href]) => (
              <a href={href} key={label}>{label}</a>
            ))}
          </div>
        ))}
      </div>
    </footer>
  )
}

function LandingPage() {
  return (
    <>
      <Announcement />
      <Header />
      <main>
        <Hero />
        <Testimonial />
        <DemoCta />
        <Features />
        <Steps />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reserve" element={<ReservationPage />} />
      <Route path="/qr" element={<ReservationPage />} />
      <Route path="/qr-code" element={<QrCodePage />} />
      <Route path="/staff" element={<RequireStaffAuth><StaffPage /></RequireStaffAuth>} />
      <Route path="/*" element={<LandingPage />} />
    </Routes>
  )
}
