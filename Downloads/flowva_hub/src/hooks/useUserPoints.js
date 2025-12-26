import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useUserPoints = (userId) => {
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userId) {
      fetchUserPoints()
    } else {
      setLoading(false)
    }
  }, [userId])

  const fetchUserPoints = async () => {
    try {
      setLoading(true)
      setError(null)

      // Verify session first
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.warn('No session found, cannot fetch points')
        setLoading(false)
        return
      }

      // Retry logic for fetching points
      let retries = 0
      const maxRetries = 3
      let lastError = null

      while (retries < maxRetries) {
        try {
          const { data, error: fetchError } = await supabase
            .from('user_profiles')
            .select('points')
            .eq('id', userId)
            .single()

          if (fetchError) {
            // If profile doesn't exist, create one
            if (fetchError.code === 'PGRST116') {
              const { data: newProfile, error: createError } = await supabase
                .from('user_profiles')
                .insert([{ id: userId, points: 0 }])
                .select()
                .single()

              if (createError) {
                console.error('Error creating profile:', createError)
                throw createError
              }
              setPoints(newProfile?.points || 0)
              break
            } else {
              lastError = fetchError
              retries++
              if (retries < maxRetries) {
                console.warn(`Retrying fetch points (attempt ${retries + 1}/${maxRetries})...`)
                await new Promise(resolve => setTimeout(resolve, 1000 * retries))
                continue
              }
              throw fetchError
            }
          } else {
            setPoints(data?.points || 0)
            break
          }
        } catch (err) {
          lastError = err
          retries++
          if (retries < maxRetries) {
            console.warn(`Retrying fetch points after error (attempt ${retries + 1}/${maxRetries})...`)
            await new Promise(resolve => setTimeout(resolve, 1000 * retries))
          } else {
            throw err
          }
        }
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching user points after retries:', err)
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        details: err.details,
        hint: err.hint
      })
    } finally {
      setLoading(false)
    }
  }

  const updatePoints = async (newPoints) => {
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({ id: userId, points: newPoints }, { onConflict: 'id' })

      if (updateError) throw updateError
      setPoints(newPoints)
    } catch (err) {
      setError(err.message)
      console.error('Error updating points:', err)
      throw err
    }
  }

  return { points, loading, error, updatePoints, refetch: fetchUserPoints }
}








