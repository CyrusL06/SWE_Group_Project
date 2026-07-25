import { Route, Routes } from 'react-router-dom'
import Button from './components/Button'
import FeatureCard from './components/FeatureCard'
import Header from './components/Header'
import HeroRide from './components/HeroRide'
import Logo from './components/Logo'
import { featureCards, footerHighlights, footerLinks, metrics, processSteps } from './data/siteContent'
import LoginPage from './pages/LoginPage'
import ReservationPage from './pages/ReservationPage'

function Announcement() {
  return (
    <div className="announcement">
      <a href="#demo">
        New commuter dashboard: predict station shortages before the morning rush
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
        <h1>Run a bike fleet riders can count on.</h1>
        <p>Track bikes, docks, maintenance, and commuter demand from one calm dashboard.</p>

        <div className="button-row">
          <Button href="#demo">Book a demo</Button>
          <Button href="#features" variant="secondary">View features</Button>
        </div>
      </div>

      <HeroRide />

      <div className="hero-stats" aria-label="CommuteTrack outcomes">
        {metrics.map(([number, label]) => (
          <div className="stat-item" key={label}>
            <span className="stat-number">{number}</span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function Testimonial() {
  return (
    <section className="section-shell testimonial" id="operations">
      <div className="quote-mark">“</div>
      <blockquote>
        CommuteTrack finally gives our dispatch, service, and rider support teams the same picture of the street. We rebalance earlier, fix the right bikes first, and answer city partners with real numbers.
      </blockquote>

      <div className="testimonial-author">
        <div className="avatar">MR</div>
        <div>
          <div className="name">Maya Rivera</div>
          <div className="title">Director of Mobility Operations</div>
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
          <div className="eyebrow eyebrow-dark">Operations demo</div>
          <h2>Map your next shift before bikes leave the dock.</h2>
        </div>

        <p>Share your fleet size and service zones. We will show how CommuteTrack turns trip demand, station status, and maintenance signals into a usable daily plan.</p>
        <Button href="mailto:sales@commutetrack.io" variant="accent">Request a walkthrough</Button>
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
          <h2>One command surface for every moving part of bike rental.</h2>
          <p>Replace fragmented spreadsheets, support tickets, and map tabs with a single operating layer that understands commuter patterns.</p>
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
        <div className="eyebrow">Launch path</div>
        <h2>Go from static fleet data to live operations.</h2>
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
      <h2>Make reliable bike access your city’s daily default.</h2>
      <p>Give operators the live visibility and field teams the priority list they need before commuter demand hits.</p>
      <Button href="#demo">Start with your network</Button>

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
          <p className="footer-disclaimer">CommuteTrack is a fleet operations platform for bike rental and commuter mobility teams. Product availability, integrations, and reporting outputs depend on fleet configuration and data sources.</p>
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
      <Route path="/*" element={<LandingPage />} />
    </Routes>
  )
}
