import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './DailyStreakCard.css'

const DailyStreakCard = ({ streak: propStreak, onClaim, isClaiming }) => {
  const { user } = useAuth()
  const [claimedToday, setClaimedToday] = useState(false)
  const [streak, setStreak] = useState(propStreak || 0)
  const [claimedDates, setClaimedDates] = useState(new Set())

  useEffect(() => {
    checkTodayClaimed()
    fetchStreak()
    if (user) {
      fetchClaimedDates()
    }
  }, [user])

  const checkTodayClaimed = async () => {
    if (!user) {
      // Authentication required - always show as not claimed when not logged in
      setClaimedToday(false)
      return
    }
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('checkin_date', today)
      .maybeSingle()
    
    setClaimedToday(!!data && !error)
  }

  const fetchStreak = async () => {
    if (!user) {
      // Authentication required - show 0 when not logged in
      setStreak(0)
      return
    }
    const { data } = await supabase
      .from('daily_checkins')
      .select('checkin_date')
      .eq('user_id', user.id)
      .order('checkin_date', { ascending: false })
    
    setStreak(data?.length || 0)
  }

  const fetchClaimedDates = async () => {
    if (!user) return
    const { data } = await supabase
      .from('daily_checkins')
      .select('checkin_date')
      .eq('user_id', user.id)
    
    if (data) {
      const dates = new Set(data.map(item => item.checkin_date))
      setClaimedDates(dates)
    }
  }

  const isDayClaimed = (dayIndex) => {
    if (!user || claimedDates.size === 0) return false
    const today = new Date()
    const dayOfWeek = today.getDay()
    const adjustedToday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    
    // Calculate the date for this day of the week
    const daysDiff = dayIndex - adjustedToday
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + daysDiff)
    const dateString = targetDate.toISOString().split('T')[0]
    
    return claimedDates.has(dateString)
  }

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const today = new Date().getDay()
  const adjustedToday = today === 0 ? 6 : today - 1 // Convert Sunday (0) to last index

  const handleClaim = async () => {
    if (claimedToday) return
    
    // If not authenticated, onClaim will open auth modal
    // If authenticated, onClaim will process the claim
    try {
      await onClaim()
      // After successful claim, refresh the state
      await checkTodayClaimed()
      await fetchStreak()
      if (user) {
        await fetchClaimedDates()
      }
    } catch (error) {
      console.error('Error claiming daily points:', error)
    }
  }

  return (
    <div className="daily-streak-card">
      <div className="card-header">
        <svg
          aria-hidden="true"
          focusable="false"
          data-prefix="far"
          data-icon="calendar"
          className="card-icon svg-inline--fa fa-calendar"
          style={{ width: '20px', height: '20px', color: '#70D6FF', flexShrink: 0 }}
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
        >
          <path
            fill="currentColor"
            d="M152 24c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40L64 64C28.7 64 0 92.7 0 128l0 16 0 48L0 448c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-256 0-48 0-16c0-35.3-28.7-64-64-64l-40 0 0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40L152 64l0-40zM48 192l352 0 0 256c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256z"
          />
        </svg>
        <h3 className="card-title">Daily Streak</h3>
      </div>
      <div className="streak-display">
        <span className="streak-value">{streak} {streak <= 1 ? 'day' : 'days'}</span>
      </div>
      <div className="calendar-week">
        {days.map((day, index) => {
          const isToday = index === adjustedToday
          const isClaimed = isDayClaimed(index)
          
          // If it's today and claimed, show as claimed (blue)
          // If it's today and not claimed, show as today (purple ring)
          // Otherwise, show as normal or claimed
          const className = isClaimed 
            ? 'day-circle claimed' 
            : isToday 
            ? 'day-circle today' 
            : 'day-circle'
          
          return (
            <div key={index} className={className}>
              {day}
            </div>
          )
        })}
      </div>
      <p className="streak-description">Check in daily to to earn +5 points</p>
      <button
        className={`claim-button ${claimedToday ? 'claimed' : ''}`}
        onClick={handleClaim}
        disabled={claimedToday || isClaiming}
      >
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
          className="button-icon"
        >
          <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
        </svg>
        {isClaiming ? "Claiming..." : claimedToday ? "Claimed Today" : "Claim Today's Points"}
      </button>
    </div>
  )
}

export default DailyStreakCard

