import { useState, useMemo, useRef, useEffect } from 'react'
import RedeemRewardCard from './RedeemRewardCard'
import './RedeemRewards.css'

const RedeemRewards = ({ rewards, userPoints, onClaim, isClaiming }) => {
  const [activeFilter, setActiveFilter] = useState('all')
  const tabsRef = useRef(null)
  const indicatorRef = useRef(null)
  const tabRefs = useRef({})

  // Categorize rewards
  const categorizedRewards = useMemo(() => {
    const all = rewards || []
    const unlocked = all.filter(r => {
      const canAfford = userPoints >= r.points_required
      const isComingSoon = r.points_required === 0 || r.coming_soon || false
      return canAfford && !r.claimed && !isComingSoon
    })
    const locked = all.filter(r => {
      const canAfford = userPoints >= r.points_required
      const isComingSoon = r.points_required === 0 || r.coming_soon || false
      return !canAfford && !r.claimed && !isComingSoon
    })
    const comingSoon = all.filter(r => r.points_required === 0 || r.coming_soon || false)

    return { all, unlocked, locked, comingSoon }
  }, [rewards, userPoints])

  // Get filtered rewards based on active tab
  const filteredRewards = useMemo(() => {
    switch (activeFilter) {
      case 'unlocked':
        return categorizedRewards.unlocked
      case 'locked':
        return categorizedRewards.locked
      case 'coming-soon':
        return categorizedRewards.comingSoon
      default:
        return categorizedRewards.all
    }
  }, [activeFilter, categorizedRewards])

  const tabs = [
    { key: 'all', label: 'All Rewards', count: categorizedRewards.all.length },
    { key: 'unlocked', label: 'Unlocked', count: categorizedRewards.unlocked.length },
    { key: 'locked', label: 'Locked', count: categorizedRewards.locked.length },
    { key: 'coming-soon', label: 'Coming Soon', count: categorizedRewards.comingSoon.length },
  ]

  useEffect(() => {
    const updateIndicator = () => {
      const activeTab = tabRefs.current[activeFilter]
      const tabsContainer = tabsRef.current
      const indicator = indicatorRef.current

      if (activeTab && tabsContainer && indicator) {
        const containerRect = tabsContainer.getBoundingClientRect()
        const activeTabRect = activeTab.getBoundingClientRect()
        
        const left = activeTabRect.left - containerRect.left
        const width = activeTabRect.width

        indicator.style.left = `${left}px`
        indicator.style.width = `${width}px`
      }
    }

    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [activeFilter])

  return (
    <div className="redeem-rewards-section">
      <h2 className="section-title">Redeem Your Points</h2>
      
      <div className="redeem-tabs-container">
        <div className="redeem-tabs" ref={tabsRef}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              ref={(el) => (tabRefs.current[tab.key] = el)}
              className={`redeem-tab ${activeFilter === tab.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab.key)}
            >
              <div className="tab-label-wrapper">
                {tab.label}
                <span className={`tab-badge ${activeFilter === tab.key ? 'active' : ''}`}>
                  {tab.count}
                </span>
              </div>
            </button>
          ))}
          <div className="tab-indicator" ref={indicatorRef}></div>
        </div>
      </div>

      <div className="redeem-rewards-grid">
        {filteredRewards.map((reward) => (
          <RedeemRewardCard
            key={reward.id}
            reward={reward}
            userPoints={userPoints}
            onClaim={onClaim}
            isClaiming={isClaiming}
          />
        ))}
      </div>
    </div>
  )
}

export default RedeemRewards

