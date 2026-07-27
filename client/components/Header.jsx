import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Header({ minimal = false }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" aria-label="CommuteTrack home" className="logo-link">
          <Logo />
        </Link>

        {!minimal && (
          <nav className="nav-links" aria-label="Main navigation">
            <Link className="nav-link" to="/staff">Staff</Link>
            <Link className="nav-link nav-cta" to="/reserve">Reserve</Link>
          </nav>
        )}
      </div>
    </header>
  )
}
