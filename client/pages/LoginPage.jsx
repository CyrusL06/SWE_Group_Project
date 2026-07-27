import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Button from '../components/Button'
import Header from '../components/Header'
import { loginStaff } from '../services/api'
import { saveStaffSession } from '../services/auth'

const demoCredentials = {
  email: 'staff@bikerental.local',
  password: 'staff123',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(demoCredentials.email)
  const [password, setPassword] = useState(demoCredentials.password)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const { session } = await loginStaff({ email: email.trim(), password })
      saveStaffSession(session)
      navigate(location.state?.from || '/staff', { replace: true })
    } catch (loginError) {
      setError(loginError.message || 'Staff login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page auth-typeform-page">
      <div className="auth-bg" />
      <Header minimal />

      <main className="auth-typeform-main">
        <section className="auth-typeform-card" aria-labelledby="login-title">
          <div className="auth-typeform-heading">
            <p className="reservation-context">Staff authentication</p>
            <h1 id="login-title">What are your staff login details?</h1>
            <p>One quick sign-in before opening the daily rental board.</p>
          </div>

          <form className="auth-typeform-form" onSubmit={handleSubmit}>
            <label className="auth-line-field" htmlFor="email">
              <span>Email</span>
              <input
                autoComplete="username"
                id="email"
                onChange={event => setEmail(event.target.value)}
                placeholder="staff@bikerental.local"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="auth-line-field" htmlFor="password">
              <span>Password</span>
              <input
                autoComplete="current-password"
                id="password"
                onChange={event => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                type="password"
                value={password}
              />
            </label>

            {error && <p className="auth-error typeform-error" role="alert">{error}</p>}

            <div>
              <Button className="auth-typeform-submit" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>

          <div className="auth-typeform-bottom">
            <p>
              Demo: <strong>{demoCredentials.email}</strong> / <strong>{demoCredentials.password}</strong>
            </p>
            <Link to="/reserve">Open customer reservation form</Link>
          </div>
        </section>
      </main>
    </div>
  )
}
