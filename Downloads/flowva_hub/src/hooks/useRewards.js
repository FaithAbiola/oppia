import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useRewards = (userId) => {
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRewards()
  }, [userId])

  const fetchRewards = async () => {
    try {
      setLoading(true)
      setError(null)

      // Retry logic for fetching rewards
      let retries = 0
      const maxRetries = 3
      let rewardsData = null

      while (retries < maxRetries) {
        try {
          const { data, error: fetchError } = await supabase
            .from('rewards')
            .select('*')
            .order('order_index', { ascending: true })

          if (fetchError) {
            console.error(`Error fetching rewards (attempt ${retries + 1}):`, fetchError)
            retries++
            if (retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retries))
              continue
            }
            throw fetchError
          }

          rewardsData = data
          break
        } catch (err) {
          retries++
          if (retries < maxRetries) {
            console.warn(`Retrying fetch rewards (attempt ${retries + 1}/${maxRetries})...`)
            await new Promise(resolve => setTimeout(resolve, 1000 * retries))
          } else {
            throw err
          }
        }
      }

      // If user is logged in, check which rewards they've claimed
      if (userId && rewardsData) {
        try {
          const { data: claimedRewards } = await supabase
            .from('user_rewards')
            .select('reward_id')
            .eq('user_id', userId)

          const claimedIds = claimedRewards?.map((r) => r.reward_id) || []

          setRewards(
            rewardsData.map((reward) => ({
              ...reward,
              claimed: claimedIds.includes(reward.id),
            }))
          )
        } catch (err) {
          console.warn('Error fetching claimed rewards, showing all as unclaimed:', err)
          setRewards(rewardsData || [])
        }
      } else {
        setRewards(rewardsData || [])
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching rewards after retries:', err)
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

  return { rewards, loading, error, refetch: fetchRewards }
}

