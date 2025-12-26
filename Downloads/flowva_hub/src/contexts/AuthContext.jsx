import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const ensureWelcomeNotification = useCallback(async (user) => {
    if (!user?.id) {
      console.log('ensureWelcomeNotification: No user ID provided')
      return
    }

    console.log('ensureWelcomeNotification: Starting for user:', user.email, 'ID:', user.id)

    try {
      const { data: existingNotifications, error: checkError } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'welcome')
        .limit(1)

      if (checkError) {
        console.error('Error checking notifications:', checkError)
        return
      }

      if (!existingNotifications || existingNotifications.length === 0) {
        const firstName = user.user_metadata?.first_name || 
                         user.user_metadata?.full_name?.split(' ')[0] ||
                         user.user_metadata?.name?.split(' ')[0] ||
                         user.email?.split('@')[0] ||
                         'there'

        console.log('ensureWelcomeNotification: Creating welcome notification for:', firstName)
        
        const { data: insertedData, error: insertError } = await supabase
          .from('notifications')
          .insert([
            {
              user_id: user.id,
              type: 'welcome',
              title: `Welcome ${firstName}!`,
              content: "We're thrilled to have you on board! Explore powerful tools, build your personal stack, and start unlocking rewards through daily streaks, referrals, and more. Your journey to smarter productivity starts here.",
              icon_bg: 'rgb(231, 245, 231)',
              icon_color: 'rgb(45, 125, 50)'
            }
          ])
          .select()

        if (insertError) {
          console.error('Error creating welcome notification:', insertError)
        } else {
          console.log('Welcome notification created successfully:', insertedData)
        }
      } else {
        console.log('ensureWelcomeNotification: Welcome notification already exists, skipping creation')
      }
    } catch (error) {
      console.error('Error ensuring welcome notification:', error)
      console.error('Error stack:', error.stack)
    }
  }, [])

  const setUserAndNotification = useCallback(async (userData, skipFreshFetch = false) => {
    if (userData) {
      console.log('Setting user state to:', userData.email)
      
      setUser(userData)
      setLoading(false)
      
      if (!skipFreshFetch) {
        supabase.auth.getUser()
          .then(({ data: { user: freshUser }, error: userError }) => {
            if (!userError && freshUser) {

              setUser(freshUser)
            } else {
              console.warn('Could not get fresh user, keeping provided userData:', userError)
            }
          })
          .catch((error) => {
            console.warn('Background: Error refreshing user data (non-critical):', error)
            // Keep the userData we already set
          })
      }
      
      // Create notification in background (don't block user state update)
      ensureWelcomeNotification(userData).catch((error) => {
        console.error('Failed to ensure welcome notification:', error)
      })
    } else {
      console.log('Setting user state to null')
      setUser(null)
      setLoading(false)
    }
    console.log('setUserAndNotification completed')
  }, [ensureWelcomeNotification])

  useEffect(() => {
    let mounted = true
    let retryCount = 0
    const maxRetries = 3
    let initialLoadComplete = false

    const loadUser = async () => {
      try {
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error getting session:', sessionError)
          if (mounted) {
            setUser(null)
            setLoading(false)
          }
          initialLoadComplete = true
          return
        }

        if (session?.user) {
          
          try {
            const { data: { user: freshUser }, error: userError } = await supabase.auth.getUser()
            
            if (userError) {
              console.error('Error getting fresh user:', userError)
              if (mounted) {
                await setUserAndNotification(session.user)
                initialLoadComplete = true
              }
            } else if (freshUser && mounted) {
              await setUserAndNotification(freshUser)
              initialLoadComplete = true
            }
          } catch (error) {
            console.error('Error fetching fresh user:', error)
            if (mounted) {
              await setUserAndNotification(session.user)
              initialLoadComplete = true
            }
          }
        } else {
          if (retryCount < maxRetries && mounted) {
            retryCount++
            setTimeout(() => {
              if (mounted) {
                loadUser()
              }
            }, 100 * retryCount) 
          } else {
            if (mounted) {
              setUser(null)
              setLoading(false)
              initialLoadComplete = true
            }
          }
        }
      } catch (error) {
        console.error('Error loading user:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
        initialLoadComplete = true
      }
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) {
        return
      }


      if (event === 'SIGNED_OUT') {
        console.log('User signed out')
        setUser(null)
        setLoading(false)
        return
      }

      if (session?.user) {
        console.log('Entering session.user block, user email:', session.user.email)
        try {
          await setUserAndNotification(session.user)
          
          if (event === 'INITIAL_SESSION') {
            initialLoadComplete = true
          } else {
            try {
              const { data: { user: freshUser }, error: userError } = await supabase.auth.getUser()
              if (!userError && freshUser) {
                await setUserAndNotification(freshUser)
              }
            } catch (bgError) {
              console.error('getUser failed:', bgError)
            }
          }
        } catch (error) {
          setUser(session.user)
          setLoading(false)
        }
      } else if (event === 'INITIAL_SESSION' && !session) {
        if (initialLoadComplete) {
          console.log('INITIAL_SESSION: No session found, user is logged out')
        setUser(null)
        setLoading(false)
        } else {
          console.log('INITIAL_SESSION: No session')
        }
      } else {
        console.log('No session found, event:', event,'')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setUserAndNotification])

  const signIn = async (email, password) => {
    try {
      console.log('Attempting sign in for:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Sign in error:', error)
        return { data: null, error }
      }
      
      if (data?.session?.user) {
        await setUserAndNotification(data.session.user, true) 
      }
      
      return { data, error: null }
    } catch (err) {
      console.error('Sign in exception:', err)
      return { data: null, error: err }
    }
  }

  const signUp = async (email, password, firstName, lastName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
        },
        emailRedirectTo: `${window.location.origin}/dashboard/earn-rewards`
      }
    })
    return { data, error }
  }

  const signOut = async () => {
    try {
      console.log('Signing out...')
    const { error } = await supabase.auth.signOut()
    if (error) {
        console.error('Error signing out from Supabase:', error)
    setUser(null)
        setLoading(false)
    return { error }
      }
      
      console.log('Sign out successful, clearing user state')
      setUser(null)
      setLoading(false)
      
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch (clearError) {
        console.warn('Error clearing local session:', clearError)
      }
      
      console.log('User signed out successfully')
      return { error: null }
    } catch (err) {
      console.error('Exception during sign out:', err)
      setUser(null)
      setLoading(false)
      return { error: err }
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser()
      if (error) throw error
      if (currentUser) {
        setUser(currentUser)
        await ensureWelcomeNotification(currentUser)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
