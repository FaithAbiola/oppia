import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import RewardsPage from './pages/RewardsPage'
import './App.css'

// Component to handle email verification redirects and root path redirects
const AppRoutes = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshUser } = useAuth()

  useEffect(() => {
    // Handle email verification callback
    if (location.hash) {
      // Check if this is an email verification callback
      const hashParams = new URLSearchParams(location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')
      
      if (accessToken && (type === 'signup' || type === 'email')) {
        // Email verification successful - Supabase will automatically handle the session
        // Wait a bit for Supabase to process the token, then refresh and redirect
        setTimeout(async () => {
          try {
            // Get the session (Supabase should have already set it from the URL)
            const { data: { session } } = await supabase.auth.getSession()
            
            if (session) {
              // Refresh user to get updated metadata
              if (refreshUser) {
                await refreshUser()
              }
            }
            
            navigate('/dashboard/earn-rewards', { replace: true })
            // Clear the hash
            window.history.replaceState(null, '', '/dashboard/earn-rewards')
          } catch (error) {
            console.error('Error handling email verification:', error)
            navigate('/dashboard/earn-rewards', { replace: true })
            window.history.replaceState(null, '', '/dashboard/earn-rewards')
          }
        }, 500) // Small delay to ensure Supabase processes the token
      }
    }
    
    // Redirect root path to rewards page
    if (location.pathname === '/' || location.pathname === '/#') {
      navigate('/dashboard/earn-rewards', { replace: true })
    }
  }, [location, navigate, refreshUser])

  return (
    <Routes>
      <Route path="/" element={<RewardsPage />} />
      <Route path="/rewards" element={<RewardsPage />} />
      <Route path="/dashboard/earn-rewards" element={<RewardsPage />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App


