import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Header from '../components/Header'

function SocialButton({ children, icon }) {
  return (
    <button className="social-button" type="button">
      {icon}
      {children}
    </button>
  )
}

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <Header minimal />

      <main className="auth-main">
        <section className="auth-panel" aria-labelledby="login-title">
          <div className="auth-heading">
            <h1 id="login-title">Sign in</h1>
            <p>Access your CommuteTrack account.</p>
          </div>

          <form className="auth-form" onSubmit={e => e.preventDefault()}>
            <label className="auth-field" htmlFor="email">
              <span>Email</span>
              <input id="email" type="email" placeholder="operator@commutetrack.io" required />
            </label>

            <label className="auth-field" htmlFor="password">
              <span className="auth-label-row">
                <span>Password</span>
                <a href="#forgot">Forgot password?</a>
              </span>
              <input id="password" type="password" placeholder="Enter your password" required />
            </label>

            <Button className="auth-submit" type="submit">Sign in</Button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="social-grid">
            <SocialButton icon={<GoogleIcon />}>Google</SocialButton>
            <SocialButton icon={<GithubIcon />}>GitHub</SocialButton>
          </div>

          <p className="auth-footer-text">
            New to CommuteTrack? <Link to="/register">Create an account</Link>
          </p>
        </section>
      </main>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#000" aria-hidden="true">
      <path d="M12 2.04c-5.5 0-10 4.46-10 9.96 0 4.4 2.86 8.14 6.82 9.46.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48A10.02 10.02 0 0022 12c0-5.5-4.5-9.96-10-9.96z" />
    </svg>
  )
}
