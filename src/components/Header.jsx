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
            <a className="nav-link nav-optional" href="#features">Platform</a>
            <a className="nav-link nav-optional" href="#operations">Operations</a>
            <Link className="nav-link" to="/login">Sign in</Link>
            <Link className="nav-link nav-cta" to="/reserve">Reserve</Link>
          </nav>
        )}
      </div>
    </header>
  )
}
