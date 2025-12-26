import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRewards } from '../hooks/useRewards'
import { useUserPoints } from '../hooks/useUserPoints'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'
import PointsBalanceCard from '../components/PointsBalanceCard'
import DailyStreakCard from '../components/DailyStreakCard'
import TopToolSpotlight from '../components/TopToolSpotlight'
import ReferAndWinCard from '../components/ReferAndWinCard'
import ShareYourStackCard from '../components/ShareYourStackCard'
import ReferEarnSection from '../components/ReferEarnSection'
import RewardCard from '../components/RewardCard'
import RedeemRewards from '../components/RedeemRewards'
import AuthModal from '../components/AuthModal'
import ClaimSuccessModal from '../components/ClaimSuccessModal'
import ClaimPointsModal from '../components/ClaimPointsModal'
import NotificationBell from '../components/NotificationBell'
import NotificationModal from '../components/NotificationModal'
import './RewardsPage.css'

const RewardsPage = () => {
  const { user } = useAuth()
  const { rewards, loading: rewardsLoading, error: rewardsError, refetch } = useRewards(user?.id)
  const { points, loading: pointsLoading, updatePoints, refetch: refetchPoints } = useUserPoints(user?.id)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimError, setClaimError] = useState('')
  const [activeTab, setActiveTab] = useState('earn')
  const [isClaimingDaily, setIsClaimingDaily] = useState(false)
  const [dailyStreak, setDailyStreak] = useState(0)
  const [demoPoints, setDemoPoints] = useState(0)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [showClaimPointsModal, setShowClaimPointsModal] = useState(false)
  const [claimTool, setClaimTool] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread notification count from database
  const fetchUnreadCount = async () => {
    if (!user?.id) {
      setUnreadCount(0)
      return
    }

    let retries = 0
    const maxRetries = 3

    while (retries < maxRetries) {
      try {
        // Get all notifications for the user
        const { data: notifications, error: notificationsError } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)

        if (notificationsError) {
          console.error(`Error fetching notifications (attempt ${retries + 1}):`, notificationsError)
          retries++
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries))
            continue
          }
          throw notificationsError
        }

        if (!notifications || notifications.length === 0) {
          setUnreadCount(0)
          return
        }

        // Get all read notification IDs
        const { data: reads, error: readsError } = await supabase
          .from('notification_reads')
          .select('notification_id')
          .eq('user_id', user.id)

        if (readsError) {
          console.warn('Error fetching read status, assuming all unread:', readsError)
          // If we can't get read status, show all as unread
          setUnreadCount(notifications.length)
          return
        }

        const readIds = new Set(reads?.map(r => r.notification_id) || [])
        const unreadNotifications = notifications.filter(n => !readIds.has(n.id))
        
        setUnreadCount(unreadNotifications.length)
        break
      } catch (error) {
        retries++
        if (retries < maxRetries) {
          console.warn(`Retrying fetch unread count (attempt ${retries + 1}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * retries))
        } else {
          console.error('Error fetching unread count after retries:', error)
          setUnreadCount(0)
        }
      }
    }
  }
  const tabsRef = useRef(null)
  const indicatorRef = useRef(null)
  const tabRefs = useRef({})

  useEffect(() => {
    if (user) {
      fetchDailyStreak()
      fetchUnreadCount()
      // Clear any demo data from localStorage when user is authenticated
      localStorage.removeItem('demoPoints')
      localStorage.removeItem('demoStreak')
      localStorage.removeItem('dailyClaimDate')
      
      // Refresh unread count after a delay to catch notifications created after sign-in
      // (e.g., welcome notification)
      const delayedRefresh = setTimeout(() => {
        console.log('Refreshing unread count after sign-in delay...')
        fetchUnreadCount()
      }, 2000) // 2 seconds should be enough for notification creation
      
      // Set up periodic refresh for unread count (every 30 seconds)
      const interval = setInterval(() => {
        fetchUnreadCount()
      }, 30000)
      
      return () => {
        clearTimeout(delayedRefresh)
        clearInterval(interval)
      }
    } else {
      // Authentication required - show 0 for demo points when not logged in
      setDemoPoints(0)
      setDailyStreak(0)
      setUnreadCount(0)
      // Clear any old demo data
      localStorage.removeItem('demoPoints')
      localStorage.removeItem('demoStreak')
      localStorage.removeItem('dailyClaimDate')
    }
  }, [user])

  useEffect(() => {
    const updateIndicator = () => {
      const activeTabElement = tabRefs.current[activeTab]
      const tabsContainer = tabsRef.current
      const indicator = indicatorRef.current

      if (activeTabElement && tabsContainer && indicator) {
        const containerRect = tabsContainer.getBoundingClientRect()
        const activeTabRect = activeTabElement.getBoundingClientRect()
        
        const left = activeTabRect.left - containerRect.left
        const width = activeTabRect.width

        indicator.style.left = `${left}px`
        indicator.style.width = `${width}px`
      }
    }

    // Small delay to ensure DOM is updated
    setTimeout(updateIndicator, 0)
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [activeTab])

  const fetchDailyStreak = async () => {
    if (!user) return
    
    let retries = 0
    const maxRetries = 3
    
    while (retries < maxRetries) {
      try {
        const { data, error } = await supabase
          .from('daily_checkins')
          .select('checkin_date')
          .eq('user_id', user.id)
          .order('checkin_date', { ascending: false })
        
        if (error) {
          console.error(`Error fetching daily streak (attempt ${retries + 1}):`, error)
          retries++
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries))
            continue
          }
          throw error
        }
        
        setDailyStreak(data?.length || 0)
        break
      } catch (err) {
        retries++
        if (retries < maxRetries) {
          console.warn(`Retrying fetch daily streak (attempt ${retries + 1}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * retries))
        } else {
          console.error('Error fetching daily streak after retries:', err)
          setDailyStreak(0)
        }
      }
    }
  }

  const handleClaimDailyPoints = async () => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    console.log('handleClaimDailyPoints: Starting claim process for user:', user.id)
    setIsClaimingDaily(true)
    setClaimError('')
    
    try {
      // Verify session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('No active session. Please sign in again.')
      }
      console.log('handleClaimDailyPoints: Session verified')

      // Check if already claimed today
      const today = new Date().toISOString().split('T')[0]
      console.log('handleClaimDailyPoints: Checking if already claimed for date:', today)
      
      let retries = 0
      const maxRetries = 3
      let existing = null
      
      while (retries < maxRetries) {
        try {
          const { data, error } = await supabase
            .from('daily_checkins')
            .select('*')
            .eq('user_id', user.id)
            .eq('checkin_date', today)
            .maybeSingle()

          if (error) {
            console.error(`Error checking existing claim (attempt ${retries + 1}):`, error)
            retries++
            if (retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retries))
              continue
            }
            throw error
          }
          
          existing = data
          break
        } catch (err) {
          retries++
          if (retries < maxRetries) {
            console.warn(`Retrying check existing claim (attempt ${retries + 1}/${maxRetries})...`)
            await new Promise(resolve => setTimeout(resolve, 1000 * retries))
          } else {
            throw err
          }
        }
      }

      if (existing) {
        console.log('handleClaimDailyPoints: Already claimed today')
        setIsClaimingDaily(false)
        return
      }

      // Record check-in
      console.log('handleClaimDailyPoints: Inserting check-in record...')
      retries = 0
      while (retries < maxRetries) {
        try {
          const { error: checkinError } = await supabase
            .from('daily_checkins')
            .insert([{ user_id: user.id, checkin_date: today }])

          if (checkinError) {
            console.error(`Error inserting check-in (attempt ${retries + 1}):`, checkinError)
            retries++
            if (retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retries))
              continue
            }
            throw checkinError
          }
          
          console.log('handleClaimDailyPoints: Check-in recorded successfully')
          break
        } catch (err) {
          retries++
          if (retries < maxRetries) {
            console.warn(`Retrying insert check-in (attempt ${retries + 1}/${maxRetries})...`)
            await new Promise(resolve => setTimeout(resolve, 1000 * retries))
          } else {
            throw err
          }
        }
      }

      // Add points
      console.log('handleClaimDailyPoints: Updating points...')
      const newPoints = points + 5
      try {
        await updatePoints(newPoints)
        console.log('handleClaimDailyPoints: Points updated successfully')
      } catch (err) {
        console.error('Error updating points:', err)
        // Don't throw - check-in was successful, points update can retry later
      }

      // Update streak
      console.log('handleClaimDailyPoints: Fetching daily streak...')
      try {
        await fetchDailyStreak()
        console.log('handleClaimDailyPoints: Daily streak updated')
      } catch (err) {
        console.warn('Error fetching daily streak (non-critical):', err)
        // Don't throw - this is non-critical
      }
      
      // Show success modal
      console.log('handleClaimDailyPoints: Claim successful, showing success modal')
      setTimeout(() => {
        setShowSuccessModal(true)
      }, 100)
    } catch (err) {
      console.error('Error claiming daily points:', err)
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        details: err.details,
        hint: err.hint
      })
      setClaimError(err.message || 'Failed to claim daily points. Please try again.')
    } finally {
      console.log('handleClaimDailyPoints: Completing, setting isClaimingDaily to false')
      setIsClaimingDaily(false)
    }
  }

  const handleClaimReward = async (reward) => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    if (points < reward.points_required) {
      setClaimError('Insufficient points')
      return
    }

    setIsClaiming(true)
    setClaimError('')

    try {
      const { error: claimError } = await supabase
        .from('user_rewards')
        .insert([
          {
            user_id: user.id,
            reward_id: reward.id,
            claimed_at: new Date().toISOString(),
          },
        ])

      if (claimError) throw claimError

      const newPoints = points - reward.points_required
      await updatePoints(newPoints)
      await refetch()
    } catch (err) {
      setClaimError(err.message || 'Failed to claim reward')
      console.error('Error claiming reward:', err)
    } finally {
      setIsClaiming(false)
    }
  }

  const handleShareStack = () => {
    // Implement share functionality
    console.log('Share stack clicked')
  }

  const handleClaimToolPoints = (tool) => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }
    setClaimTool(tool)
    setShowClaimPointsModal(true)
  }

  return (
    <div className="rewards-page">
      <Sidebar onSignInClick={() => setIsAuthModalOpen(true)} />
      <main className="rewards-main">
        <div className="rewards-container">
          <div className="rewards-header">
          <div className="header-top">
            <div className="header-left">
              <button className="mobile-menu-button lg:hidden">
                <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none" width="28">
                  <path fill="#000000" fillRule="evenodd" d="M19 4a1 1 0 01-1 1H2a1 1 0 010-2h16a1 1 0 011 1zm0 6a1 1 0 01-1 1H2a1 1 0 110-2h16a1 1 0 011 1zm-1 7a1 1 0 100-2H2a1 1 0 100 2h16z"></path>
                </svg>
              </button>
              <h1 className="page-title">Rewards Hub</h1>
            </div>
            <div className="header-right">
              <div style={{ position: 'relative' }}>
                <NotificationBell 
                  unreadCount={unreadCount} 
                  onClick={() => setShowNotificationModal(true)}
                />
                <NotificationModal 
                  isOpen={showNotificationModal} 
                  onClose={() => {
                    setShowNotificationModal(false)
                    // Refresh unread count when modal closes
                    fetchUnreadCount()
                  }}
                  onMarkAllAsRead={() => {
                    // Refresh unread count from database
                    fetchUnreadCount()
                  }}
                  user={user}
                />
              </div>
            </div>
          </div>
            <p className="page-subtitle">
              Earn points, unlock rewards, and celebrate your progress!
            </p>
          </div>
          <div className="tabs-wrapper">
            <div className="tabs" ref={tabsRef}>
              <button
                ref={(el) => (tabRefs.current['earn'] = el)}
                className={`tab-button ${activeTab === 'earn' ? 'active' : ''}`}
                onClick={() => setActiveTab('earn')}
              >
                Earn Points
              </button>
              <button
                ref={(el) => (tabRefs.current['redeem'] = el)}
                className={`tab-button ${activeTab === 'redeem' ? 'active' : ''}`}
                onClick={() => setActiveTab('redeem')}
              >
                Redeem Rewards
              </button>
              <div className="tab-indicator" ref={indicatorRef}></div>
            </div>
          </div>

          <div className="tab-content-wrapper">
            {claimError && (
              <div className="error-banner">
                {claimError}
                <button onClick={() => setClaimError('')}>×</button>
              </div>
            )}

            {activeTab === 'earn' ? (
            <>
              {/* Your Rewards Journey Section */}
              <section className="rewards-journey">
                <h2 className="section-title">Your Rewards Journey</h2>
                <div className="journey-cards">
                  <PointsBalanceCard points={user ? (pointsLoading ? 0 : points) : demoPoints} />
                  <DailyStreakCard
                    streak={dailyStreak}
                    onClaim={handleClaimDailyPoints}
                    isClaiming={isClaimingDaily}
                  />
                  <TopToolSpotlight onClaim={handleClaimToolPoints} />
                </div>
              </section>

              {/* Earn More Points Section */}
              <section className="earn-more-points">
                <h2 className="section-title">Earn More Points</h2>
                <div className="earn-cards">
                  <ReferAndWinCard />
                  <ShareYourStackCard onShare={handleShareStack} />
                </div>
              </section>

              {/* Refer & Earn Section */}
              <section className="refer-earn-section-wrapper">
                <h2 className="section-title">Refer & Earn</h2>
                <ReferEarnSection referrals={0} pointsEarned={0} />
              </section>
            </>
          ) : (
            <section className="redeem-rewards">
              {rewardsLoading || pointsLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading rewards...</p>
                </div>
              ) : rewardsError ? (
                <div className="error-state">
                  <p>Error loading rewards: {rewardsError}</p>
                  <button onClick={refetch} className="retry-button">
                    Retry
                  </button>
                </div>
              ) : (
                <RedeemRewards
                  rewards={rewards}
                  userPoints={user ? points : demoPoints}
                  onClaim={handleClaimReward}
                  isClaiming={isClaiming}
                />
              )}
            </section>
          )}
          </div>
        </div>
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ClaimSuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
        points={5}
      />
      <ClaimPointsModal
        isOpen={showClaimPointsModal}
        onClose={() => {
          setShowClaimPointsModal(false)
          setClaimTool(null)
        }}
        points={claimTool?.points || 50}
        toolName={claimTool?.name || 'Reclaim'}
        onSuccess={(data) => {
          // Show success message (you can customize this)
          console.log('Claim submitted:', data)
          // Optionally show a toast notification or success modal
        }}
      />
    </div>
  )
}

export default RewardsPage
