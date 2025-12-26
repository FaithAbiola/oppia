import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './AuthModal.css'

const AuthModal = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, user } = useAuth()

  // Close modal when user successfully signs in (backup in case direct close doesn't work)
  useEffect(() => {
    console.log('AuthModal useEffect - user:', user?.email, 'isOpen:', isOpen)
    
    if (user && isOpen) {
      setEmail('')
      setPassword('')
      setError('')
      setLoading(false)
      onClose()
    }
  }, [user, isOpen, onClose])

  useEffect(() => {
    if (isOpen && !user && !loading) {
      const checkSessionAndClose = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('Session detected but user state not set, closing modal...', session.user.email)
          setLoading(false)
          setEmail('')
          setPassword('')
          setError('')
          onClose()
        }
      }
      const timeoutId = setTimeout(checkSessionAndClose, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [isOpen, user, loading, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      if (isSignUp) {
        // Validate first name and last name for sign up
        if (!firstName.trim() || !lastName.trim()) {
          setError('First name and last name are required')
          setLoading(false)
          return
        }

        const { data, error: authError } = await signUp(email, password, firstName, lastName)

        if (authError) {
          setError(authError.message)
        } else {
          if (data?.user && !data?.session) {
            setSuccessMessage('Please check your email to verify your account before signing in.')
            setFirstName('')
            setLastName('')
            setEmail('')
            setPassword('')
          } else {
            onClose()
            setFirstName('')
            setLastName('')
            setEmail('')
            setPassword('')
          }
        }
      } else {
        try {
          console.log('Starting sign in process...')
          const result = await signIn(email, password)
          console.log('Sign in result:', result)

          if (result.error) {
            console.error('Sign in error:', result.error)
            setError(result.error.message || 'Failed to sign in. Please check your credentials.')
            setLoading(false)
            return
          }

          setLoading(false)
          
          const { data: { session } } = await supabase.auth.getSession()
          console.log('Session check after sign in:', session?.user?.email || 'no session')
          
          if (session?.user) {
            console.log('Session found, closing modal immediately')
            setEmail('')
            setPassword('')
            setError('')
            setTimeout(() => {
              onClose()
            }, 50)
          } else {
            setTimeout(() => {
              const checkAgain = async () => {
                const { data: { session: retrySession } } = await supabase.auth.getSession()
                if (retrySession?.user) {
                  console.log('Session found on retry, closing modal')
                  onClose()
                }
              }
              checkAgain()
            }, 200)
          }
        } catch (err) {
          console.error('Sign in exception:', err)
          setError(err.message || 'An error occurred during sign in. Please try again.')
          setLoading(false)
        }
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError(err.message || 'An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          ×
        </button>
        <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
        {successMessage ? (
          <div className="success-content">
            <div className="success-message">
              {successMessage}
            </div>
            <button 
              type="button" 
              className="submit-button" 
              onClick={() => {
                onClose()
                setSuccessMessage('')
                setFirstName('')
                setLastName('')
                setEmail('')
                setPassword('')
                setShowPassword(false)
              }}
            >
              OK
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              {isSignUp && (
                <>
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      placeholder="Enter your last name"
                    />
                  </div>
                </>
              )}
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {error && <div className="error-message">{error}</div>}
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </form>
            <p className="auth-switch">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                  setSuccessMessage('')
                  setFirstName('')
                  setLastName('')
                  setEmail('')
                  setPassword('')
                  setShowPassword(false)
                }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default AuthModal






